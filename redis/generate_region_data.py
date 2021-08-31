# -*- coding: utf-8 -*-
"""
Created on Tue Mar  9 17:40:41 2021

@author: Cameron Cummins
"""

import xarray as xr
import numpy as np
import geopandas
from geojson import Point, Feature, FeatureCollection, dump
import regionmask
import rioxarray
from shapely.geometry import mapping, Polygon
import shapely.errors
import persad_data_analyze as pdata
import warnings
import json
from multiprocessing import Process

def adjustCoordinates(data:xr.core.dataarray.DataArray) -> xr.core.dataarray.DataArray:
    """
    Parameters
    ----------
    data : xr.core.dataarray.DataArray
        Data array to adjust coordinate for
    Returns
    -------
    TYPE
        Data array with coordinates adjusted to lon: -180, 180

    """
    return data.assign_coords(lon=(((data.lon + 180) % 360) - 180)).sortby('lon')

def analyzeRegions(region_shapefile_path:str, shapefile_variable:str, cumulative_data:xr.core.dataarray.DataArray) -> list:
    """
    Parameters
    ----------
    region_shapefile_path : str
        path to shapefile to use for defining regions
    shapefile_variable : str
        name of variable to extract from shapefile for labeling regions
    cumulative_data : xr.core.dataarray.DataArray
        data array to find metrics for each region in\
    Returns
    -------
    list
        Returns JSON-style list with info concerning each region defined in the shapefile that had relevent data specified in the array

    """
    # Adjust coordinates to match the shapefile coordinates
    data = adjustCoordinates(cumulative_data)
    # Set spatial dimensions for data
    data.rio.set_spatial_dims(x_dim='lon', y_dim='lat', inplace=True)
    # Specify CRS projection to match shapefile data
    data.rio.write_crs("epsg:4326", inplace=True)
    
    # Read ing shapefile
    shapefile = geopandas.read_file(region_shapefile_path)
    
    # Create list for storing information on each region
    regions_analysis = []
    # Create list for storing just the metric values for each region (for data analysis purposes)
    values = []
    
    # Calculate lat and lon radius for grid cells (this is later used to calculate the intersections of data and shapefile points)
    cell_radius_lat = (data.coords['lat'][1].item() - data.coords['lat'][0].item()) / 2
    cell_radius_lon = (data.coords['lon'][1].item() - data.coords['lon'][0].item()) / 2
    
    # Iterate over every region labeled by the specified variable
    for index, var in enumerate(shapefile[shapefile_variable]):
        print("Calculating region #" + str(index) + ": " + str(var))
        # Get polygon geometry for this region
        polys = [shapefile["geometry"][index]]
        # Format geometry set
        geom = { 'OBJECTID': index, 'geometry':polys}
        # Build data frame with same CRS
        geom_dataframe = geopandas.GeoDataFrame(geom, crs=shapefile.crs)
        
        # Mask data to region, including all regions it touches, not just encapsulates
        mask = data.rio.clip(geom_dataframe.geometry.apply(mapping), shapefile.crs, drop=True, all_touched=True)
        # Adjust data frame to appropraite CRS one more time to make sure it's accurate (the warning still appears so whatever)
        geom_dataframe = geom_dataframe.to_crs("epsg:4326")
        # Get total area of region
        total_area = geom_dataframe.area.item()
        
        # Whether or not the value was properly calculated
        valid = True
        
        # Weighted average of value of metric for this given region
        value = 0
        # Iterate through each point in the masked data
        for lats in mask:
            for pt in lats:
                # Get coordinates
                lat = pt['lat'].item()
                lon = pt['lon'].item()
                # Calculate corners of the data grid cell
                tl_corner = (lon - cell_radius_lon, lat + cell_radius_lat)
                tr_corner = (lon + cell_radius_lon, lat + cell_radius_lat)
                br_corner = (lon + cell_radius_lon, lat - cell_radius_lat)
                bl_corner = (lon - cell_radius_lon, lat - cell_radius_lat)
                # Create a polygon "box" that defines the grid cell
                cell = Polygon([tl_corner, tr_corner, br_corner, bl_corner])
                # Find the area of the overlap between the region and the data grid cell, it will throw an error if the geometry is invalid
                try:
                    overlap_area = geom_dataframe.geometry[0].intersection(cell).area
                except shapely.errors.TopologicalError:
                    valid = False
                    break
                # If the value of the metric's point is not NaN
                if not np.isnan(pt.item()):
                    # Add this weighted value to the weighted average
                    value += (overlap_area / total_area) * pt.item()
        # Once the analysis for this region is complete, generate a set and add it to the list
        regions_analysis.append({ 'index':index, 'NAME':var, 'value':value, 'valid':valid})
        # Also add the value for the metric for other data analysis stuff
        values.append(value)
    return (regions_analysis, values)

# List of models to use
models = ['ACCESS1-0', 'CCSM4', 'CESM1-BGC','CMCC-CMS','CNRM-CM5', 'CanESM2', 'GFDL-CM3','HadGEM2-CC','HadGEM2-ES','MIROC5']

# List of RCP models to use
rcps = ["_RCP85", "_RCP45"]

hist_suffix = '_now'

# Directory containing model data
data_dir = '/home/p1/persad_research/water_research/datadrive/Analysis_Output/'

# List of metrics to find.
metrics = ['frac_extreme', 'max_threeday_precip', 'nov_mar_percent',
           'rainfall_ratio', 'num_ros_events', 'norm_rain_on_snow',
           'SWE_total', 'et']

data_dir = "/home/p1/persad_research/water_research/datadrive/Analysis_Output/"
output_dir = "json_data/"

shapefile_dir = "../shapefiles/"
shapefiles = ["CA_Counties_TIGER2016", "CA_Places_TIGER2016", "CA_Bulletin_118_Groundwater_Basins", "WBD_USGS_HUC10_CA"]
var_name = ["NAME", "NAME", "Basin_Su_1", "Name"]

def calculate_over_rcp(metric, rcp, shapefile, s_var_name):
    metric_models = pdata.getModelsFromNetCDF(data_dir + metric + rcp + ".nc", models)
    metric_hist_models = pdata.getModelsFromNetCDF(data_dir + metric + rcp + hist_suffix + ".nc", models)
    # If this specific metric is SWE, only take positive data
    if metric == 'SWE_total':
        for index in range(len(metric_hist_models)):
            metric_hist_models[index] = metric_hist_models[index].where(metric_hist_models[index] > 1)
            metric_models[index] = metric_models[index].where(metric_hist_models[index])
    # Calculate average of all models
    mean_model = pdata.getMeanModel(metric_models)
    # Calculate agreement amongst all models
    model_agreement = pdata.getModelsAgreement(mean_model, metric_models)
    # Calculate average change from historical to future for each model
    avg_model_per_change = pdata.getMeanModel(pdata.getRelativeRatioModels(metric_models, metric_hist_models))
    
    region_averages, region_averages_valid = analyzeRegions(shapefile_dir + shapefile + ".shp", s_var_name, avg_model_per_change)
    region_agreement, region_agreement_valid = analyzeRegions(shapefile_dir + shapefile + ".shp", s_var_name, model_agreement)
    
    # Dump the information into a JSON file
    with open(output_dir + metric + rcp + shapefile + "_totalaverage.json", 'w') as output:
        json.dump(region_averages, output, indent=2)
    with open(output_dir + metric + rcp + shapefile + "_totalaverage_list.json", 'w') as output:
        json.dump(region_averages_valid, output, indent=2)
    with open(output_dir + metric + rcp + shapefile + "_totalagreement.json", 'w') as output:
        json.dump(region_agreement, output, indent=2)
    with open(output_dir + metric + rcp + shapefile + "_totalagreement_list.json", 'w') as output:
        json.dump(region_agreement_valid, output, indent=2)
                

# The area function returns a warning even when the CRS is set, so I just "muted" it
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    for metric in metrics:
        for rcp in rcps:
            for index, shapefile in enumerate(shapefiles):
                Process(target=calculate_over_rcp, args=(metric,rcp,shapefile, var_name[index],)).start()
