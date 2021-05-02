# -*- coding: utf-8 -*-
"""
Created on Sun Feb 28 18:28:41 2021
Updated 3/4/21

@author: Cameron Cummins
"""

from flask import Flask, render_template, send_from_directory, request
from os.path import join, isfile
from os import listdir
import redis
import json

# Set flask app name and upload folder. This tells flask where the top directory is.
app = Flask(__name__)
# In this case, we want the top directory to be the upload directory (this will also function as download)
app.config['UPLOAD_FOLDER'] = "."
# Start from the top directory, where is the data located
data_dir = app.root_path + "/data/json_data/"
# Connect to redis database server, decoding the responses converts all data recieved from bytes into python objects
rd = redis.StrictRedis(host = "127.0.0.1", port = 6379, decode_responses = True)
# Preload keys, this will make sorting through keys a lot more efficient
data_keys = rd.keys()

# For downloading entire files within the flask directories (such as JSON or Shapefile)
@app.route('/download/<path:filename>', methods=['GET', 'POST'])
def download(filename):
    uploads = join(app.root_path, app.config['UPLOAD_FOLDER'])
    return send_from_directory(directory=uploads, filename=filename)

# A basic data request that grabs key-values from the redis server using the filters specified by paramters
@app.route('/data')
def getData():
    # These are the parameters that will specify the filter
    metric = request.args.get('metric', default='', type=str)
    rcp = request.args.get('rcp', default='', type=str)
    # If the region is a specific groundwater basin, it should have a unique number associated with it
    basin_num = request.args.get('basin-number', default='', type=str)
    # Filter applied to keys, so if any keys have the data_filter in them, the value for that key will be returned
    data_filter = request.args.get('data-filter', default='', type=str)
    # Group of regions, ie Groundwater Basins, Counties, Places
    region_set = request.args.get('region-set', default='', type=str)
    # Type of metric, such as average vs agreement
    metric_type = request.args.get('metric-type', default='', type=str)
    
    print(metric)
    print(rcp)
    print(basin_num)
    print(data_filter)
    print(region_set)
    print(metric_type)
    
    # Then iterate through all of the keys and filter out the ones that match the paramters
    filtered_keys = [f for f in data_keys if metric in f
                         and rcp in f
                         and region_set in f
                         and basin_num in f
                         and metric_type in f]
    
    print(len(filtered_keys))
    
    ret = "<br>"
    
    avg = 0
    # Then iterate through all of the filtered keys to get their corresponding values from the redis server
    for key in filtered_keys:
        # Get data and load into a dictionary using JSON
        data = json.loads(rd.get(key))
        # Format data into something readible
        ret += "{}, {}, {} = {} <br>".format(str(data["metric"]), "Avg", str(data["rcp"]), str(round(data["value"], 2)))
        # Calculate average
        avg = data["value"] / len(filtered_keys)
        
    return str(avg) + ret

# This is the main landing page, what the user sees
@app.route('/')
def main():
    # We use the HTML file as the template
    return render_template("mapbox_map.html")

if __name__ == "__main__":
    # Port 1024 is open on thunder for most users
    app.run(host="localhost", port=1024, debug=True)
