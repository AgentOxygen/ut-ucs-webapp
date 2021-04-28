# -*- coding: utf-8 -*-
"""
Created on Fri Apr  9 12:26:01 2021

@author: Cameron Cummins
"""
import redis
import json
from os import listdir
from os.path import isfile, join
import uuid

data_dir = "/home/persad_users/csc3323/regional_data/data/"

print("Connecting to database...")
rd = redis.StrictRedis(host="127.0.0.1", port="6379", db=0, decode_responses=True)
print("Connected. Flushing...")
rd.flushdb()

datasets = [f for f in listdir(data_dir) if isfile(join(data_dir, f))]

# List of RCP models to use
rcps = ["RCP85", "RCP45"]

# List of metrics to find.
metrics = ['frac_extreme', 'max_threeday_precip', 'nov_mar_percent',
           'rainfall_ratio', 'num_ros_events', 'norm_rain_on_snow',
           'SWE_total', 'et']
data_types = ["totalagreement", "totaleaverage"]

region_sets = ["counties", "groundwaterbasins", "places", "watersheds"]

rd_data = {}

for file_name in datasets:
    name = file_name[0:-5:1]
    metric = ""
    rcp = ""
    region_set = ""
    data_type = ""
    
    if "valid" in name:
        continue
    for metric_ in metrics:
        if metric_ in name:
            metric = metric_
            break
    for rcp_ in rcps:
        if rcp_ in name:
            rcp = rcp_
            break
    for dtype in data_types:
        if dtype in name:
            data_type = dtype
            break
    for region_ in region_sets:
        if region_ in name:
            region_set = region_
            break
    
    if data_type == "_totaleaverage":
        data_type = "_totalaverage"
    
    print(name)
    print("M: " + metric + "  R: " + rcp + "  RS: " + region_set + "  MT: " + data_type)
    
    if not ("valid" in file_name):
        with open(data_dir + file_name, 'r') as f:
            data = json.load(f)
            regions = data
            for region in regions:
                region_name = ""
                if "Basin_Su_1" in region:
                    region_name = region["Basin_Su_1"]
                elif "Name" in region:
                    region_name = region["Name"]
                else:
                    region_name = region["NAME"]
                region["metric"] = metric
                region["rcp"] = rcp
                region["type"] = data_type
                region["region-ID"] = region_name
                region["regionset-ID"] = region_set
                if not region_set in rd_data:
                    rd_data[region_set] = {}
                    rd_data[region_set][region_name] = {}
                    rd_data[region_set][region_name][metric]= {}
                if not region_name in rd_data[region_set]:
                    rd_data[region_set][region_name] = {}
                    rd_data[region_set][region_name][metric]= {}
                if not metric in rd_data[region_set][region_name]:
                    rd_data[region_set][region_name][metric]= {}
                if not rcp in rd_data[region_set][region_name][metric]:
                    rd_data[region_set][region_name][metric][rcp] = {}
                rd_data[region_set][region_name][metric][rcp] = region
                
rd.set("data", json.dumps(data))