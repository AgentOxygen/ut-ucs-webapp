# UT-UCS Hydroclimate Web App

This system is best understood in four parts:
1. Flask App
2. Redis Databse
3. HTML Template w/ Javascript
4. Mapbox API

## Flask App
Running `run.py` starts the Flask API which will act as the medium through which user can get data. For more information on Flask, check [this documentation website](https://programminghistorian.org/en/lessons/creating-apis-with-python-and-flask).

Flask works by hosting on a specific address (default is localhost on port 5000) creating routes for the user to hit. Here are some examples:
~~~
http://localhost:5000/
http://localhost:5000/route1/
http://localhost:5000/route2/
http://localhost:5000/routeA/routeB/
http://localhost:5000/routeA/routeB/<paramter>?paramter=value&paramter=value
~~~
You can also add parameters to these routes, which allows Flask to take input data from the user.

The `run.py` contains functions with decorators that are called when a route is hit. Some of the routes will directly parse data retrieved from the redis database.

## Redis Database
Documentation for redis can be found [here](https://redis.io/). Redis is used to store the data for each region, including values corresponding to each RCP, model, and metric. The JSON files produced by the `generate_region_data.py` are uploaded to redis using `build_redis.py` so that the Flask API doesn't have to preform a disk read everytime the data is updated. The JSON files are purley for accelerating the debugging process and preventing an annoying setback (accidentally deleting the JSON files is a lot harder than flushing the redis database). Running `generate_region_data.py` on multiple processes in parallel can take about 10 minutes to generate the files (8 hours on a single process). Avoid redoing the JSON file calculations.

Redis uses keys and hash-maps to store data. This makes retrieving data relatively efficient and filtering through data easier. Redis python methods are implemented in `run.py`

Here is what a single entry in the JSON file looks like for the groundwater basins.
~~~
{
    "index": 0,
    "Basin_Su_1": "POTRERO VALLEY",
    "value": 9.975532304238397,
    "valid": true
  },
~~~

`index` refers to the index of the region in the shapefile.  
`Basin_Su_1` refers to the complete name of the region, sub-region included  
`value` refers to value for the given region, in this case, an averaged of all the models  
`valid` indicates whether or not the region given in the shapefile produced valid geometry to calculate for a value. If this is false, then the value cannot be trusted and further debugging is required for this region specifically.  

The metric, measurement, region set, and RCP are all indicated in the name of the JSON file.  

The directory `redis-stable` contains the files and dependencies for running the redis database. There is a complete `README.md`, to start the server:
~~~
cd src
./redis-server
~~~

Running `build_redis.py` then reads all of the JSON files in the specified directory and reformats the data into dictionaries that are then added to the redis database.  
This the the data structure produced by the script:
et_RCP45CA_Bulletin_118_Groundwater_Basins_totalagreement_list
~~~
_Metric
└──_RCP
   └──_Region Set
      └──_Metric Type
		 └──_Region
			├── Model Values
			├── Average of Models
			└── Model Agreement
~~~

The first four identifiers `Metric`, `RCP`, `Region Set`, and `Metric Type` are contained within the key stored in the redis database.


## HTML Template w/ JS
Flask will automatically search the `templates` directory for HTML templates to use. There is only one template currently: `mapbox_map.html` 

The interactive features of the webpage are powered by JavaScript. It also provides for Mapbox integration.

The JS functions associated with the buttons and drop down menus, including interactions in the Mapbox map, request data via URL routes specified in the Flask app. The methods in the Flask API pull data from the redis server.

## Script.js
The functions in this script are what give the web app its functionality. Most of the functions can be traced back to the buttons in the HTML document. Here are the notable ones:

>updateInfo()
>> Updates innerHTML fields to match the values pulled from the dataset (averages, agreements, other data values)

>updateDataset(metric, rcp, region_group, data)
>> Updates the current dataset by downloading JSON data from the Flask API that corresponds to the metric, rcp, region group, and other data

>focusOnPane(focus_pane)
>> Shifts focus of primary pane from information to buttons by showing and hiding DIV groups in the HTML

>setMapRegions(spec_region)
>> Changes visible layer to specified region group

## Mapbox API
You can find the documentation for Mapbox [here](https://docs.mapbox.com/api/overview/). This API creates the ineteractive map for the webpage and has a bunch of other cool visualization features. Note that there is a quota on how many requests can be made to Mapbox services. It's unlikely that we will exceed this quota, but it is something to keep in mind as different features have different amounts. Info on pricing and quotas can be found [here](https://www.mapbox.com/pricing/).


## Converting Shapefiles to GEOJSON for Mapbox
[https://products.aspose.app/gis/conversion/shapefile-to-geojson](https://products.aspose.app/gis/conversion/shapefile-to-geojson)