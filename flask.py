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

# For downloading entire files within the flask directories (such as JSON or Shapefile)
@app.route('/download/<path:filename>', methods=['GET', 'POST'])
def download(filename):
    uploads = join(app.root_path, app.config['UPLOAD_FOLDER'])
    return send_from_directory(directory=uploads, filename=filename)

# A basic data request that grabs key-values from the redis server using the filters specified by paramters
@app.route('/data/<key>')
def getData(key):
    return rd.get(key)

# This is the main landing page, what the user sees
@app.route('/')
def main():
    # We use the HTML file as the template
    return render_template("mapbox_map.html")

if __name__ == "__main__":
    # Port 1024 is open on thunder for most users
    app.run(host="localhost", port=1024, debug=True)
