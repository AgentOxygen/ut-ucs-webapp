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

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = "."
data_dir = app.root_path + "/data/json_data/"
rd = redis.StrictRedis(host = "127.0.0.1", port = 6379, decode_responses = True)
data_keys = rd.keys()

@app.route('/download/<path:filename>', methods=['GET', 'POST'])
def download(filename):
    uploads = join(app.root_path, app.config['UPLOAD_FOLDER'])
    return send_from_directory(directory=uploads, filename=filename)

@app.route('/data')
def getData():
    metric = request.args.get('metric', default='', type=str)
    rcp = request.args.get('rcp', default='', type=str)
    basin_num = request.args.get('basin-number', default='', type=str)
    data_filter = request.args.get('data-filter', default='', type=str)
    region_set = request.args.get('region-set', default='', type=str)
    metric_type = request.args.get('metric-type', default='', type=str)
    
    print(metric)
    print(rcp)
    print(basin_num)
    print(data_filter)
    print(region_set)
    print(metric_type)
    
    filtered_keys = [f for f in data_keys if metric in f
                         and rcp in f
                         and region_set in f
                         and basin_num in f
                         and metric_type in f]
    
    print(len(filtered_keys))
    
    ret = "<br>"
    
    avg = 0
    for key in filtered_keys:
        data = json.loads(rd.get(key))
        ret += "{}, {}, {} = {} <br>".format(str(data["metric"]), "Avg", str(data["rcp"]), str(round(data["value"], 2)))
        avg = data["value"] / len(filtered_keys)
        
    return str(avg) + ret
    
@app.route('/')
def main():
    return render_template("mapbox_map.html")

if __name__ == "__main__":
    app.run(host="localhost", port=1024, debug=True)
