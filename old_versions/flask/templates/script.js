// Default initial parameters
console.log("Setting default parameters...")
var domain = document.location;
var current_rcp = "RCP85";
var current_models = [];
var current_metric = "frac_extreme";
var current_region_group = "CA_Bulletin_118_Groundwater_Basins";
var current_info_data = ["totalaverage", "totalagreement"]
var current_region_name = "";
var current_info_avg_value = "";
var current_info_agree_value = "";

var current_avg_dataset = [];
var current_agree_dataset = [];
var data1_loaded = false;
var data2_loaded = false;
var region_index = 0;

// All information panes to the left of the map
let panes = ["primary-pane", "choose-models-pane", "choose-metric-pane"];

// Initialize current variables using methods
buttonChangeMetric("frac_extreme");
setRCP85();

// Initialize dataset
updateDataset(current_metric, current_rcp, current_region_group, current_info_data);

// =============== Initialize Mapbox API ===============
// Get  API token
mapboxgl.accessToken = 'pk.eyJ1Ijoib3h5Z2VuMSIsImEiOiJja25jMmh3b28wenFlMnFvaGowN3B6bmc1In0.MKaFBCRkpp4gZWA3hIT-iA';

// Load map
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-122.486052, 37.830348],
    zoom: 4.9
});
var hoveredStateId  = null;
// =============== End of Initialization ===============

// Displays specified pane and hides all others
function focusOnPane(focus_pane) {
    for (const pane of panes){
        if (pane == focus_pane){
            document.getElementById(pane).style.display = "inline";
        }else{
            document.getElementById(pane).style.display = "none";
        }
    }
}

/*
id="info-section"
id="info-region_name"></div></h2>
id="info-metric"></div></h4>
id="info-model_average"></div></h4>
id="info-model_agremeent"></div></h4>
*/

// Sets which regions to display on the map
function setMapRegions(spec_region){
    document.getElementById(current_region_group + "-checkbox").checked = false;
    map.setLayoutProperty(current_region_group + "-borders", 'visibility', 'none');
    map.setLayoutProperty(current_region_group + "-fills", 'visibility', 'none');
    current_region_group = spec_region;
    map.setLayoutProperty(spec_region + "-borders", 'visibility', 'visible');
    map.setLayoutProperty(spec_region + "-fills", 'visibility', 'visible');
    updateDataset(current_metric, current_rcp, current_region_group, current_info_data);
}


// Sets selected RCP to RCP 4.5
function setRCP45() {
    console.log("Switching to RCP 4.5")
    document.getElementById('rcp85-checkbox').checked = false;
    current_rcp = "RCP45";
    updateDataset(current_metric, current_rcp, current_region_group, current_info_data);
}


// Sets selected RCP to RCP 8.5
function setRCP85() {
    console.log("Switching to RCP 8.5")
    document.getElementById('rcp45-checkbox').checked = false;
    current_rcp = "RCP85";
    updateDataset(current_metric, current_rcp, current_region_group, current_info_data);
}


// Displays metrics pane with options to choose metric
function displayMetricsPane() {
    focusOnPane("choose-metric-pane");
}


// Displays models pane with options to choose models
function displayModelsPane() {
    focusOnPane("choose-models-pane");
}


// Initiates information update with metric selection and shifts focus back to primary pane
function buttonChangeMetric(metric){
    focusOnPane("primary-pane");
    document.getElementById(current_metric + '-button').disabled = false;
    document.getElementById(metric + '-button').disabled = true;
    current_metric = metric;
    updateDataset(current_metric, current_rcp, current_region_group, current_info_data);
}


// Initiates information update with model selections and shifts focus back to primary pane
function buttonChangeModels(){
    console.log("Confirming model change (doesn't do anything for now)")
    updateDataset(current_metric, current_rcp, current_region_group, current_info_data);
    focusOnPane("primary-pane");
}


// Updates the current dataset
function updateDataset(metric, rcp, region_group, data){
    // frac_extreme_RCP85_WBD_USGS_HUC10_CA_totalaverage
    url = domain + "/data/" + metric + "_"+ rcp + "_" + region_group + "_" + data[0];
    url2 = domain + "/data/" + metric + "_"+ rcp + "_" + region_group + "_" + data[1];
    data1_loaded = false;
    data2_loaded = false;

    fetch(url).then(response => response.text())
        .then(textString => {
            current_avg_dataset = JSON.parse(textString);
            data1_loaded = true;
            updateInfo();
    });
    fetch(url2).then(response => response.text())
        .then(textString => {
            current_agree_dataset = JSON.parse(textString);
            data2_loaded = true;
            updateInfo();
    });
}


// Updates all info tags in the HTML to reflect 'current_' variables
function updateInfo() {
    if (data2_loaded && data1_loaded){
        data = current_avg_dataset[region_index];
        current_info_avg_value = data["value"];

        current_region_name = data["NAME"];
        data = current_agree_dataset[region_index];
        current_info_agree_value = data["value"];

        document.getElementById("info-section").style.display = "inline";
        document.getElementById("info-region_name").innerHTML = current_region_name;
        document.getElementById("info-metric").innerHTML = current_metric;
        document.getElementById("info-model_average").innerHTML = current_info_avg_value;
        document.getElementById("info-model_agreement").innerHTML = current_info_agree_value;
    }
}

/* ===================================== Mapbox API ===================================== */

map.on('load', function () {

    // ================== Groundwater Basin data, layers (fill and borders), and mouse functions ==================
    map.addSource('CA_Bulletin_118_Groundwater_Basins', {
        type: 'geojson',
        data: domain + "download/geojson/CA_Bulletin_118_Groundwater_Basins.geojson",
        generateId: true
        });
    map.addLayer({
        'id': 'CA_Bulletin_118_Groundwater_Basins-fills',
        'type': 'fill',
        'source': 'CA_Bulletin_118_Groundwater_Basins',
        'layout': {'visibility': 'visible'},
        'paint': {
            'fill-color': '#088',
            'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.5 ]
        }
    });
    map.addLayer({
        'id': 'CA_Bulletin_118_Groundwater_Basins-borders',
        'type': 'line',
        'source': 'CA_Bulletin_118_Groundwater_Basins',
        'layout': {'visibility': 'visible'},
        'paint': {
            'line-color': '#627BC1',
            'line-width': 2
        }
    });
    // When a user moves their mouse into one of the regions specified in this group
    map.on('mousemove', 'CA_Bulletin_118_Groundwater_Basins-fills', function (e) {
        if (e.features.length > 0) {
            if (hoveredStateId !== null) {
                map.setFeatureState(
                    { source: 'CA_Bulletin_118_Groundwater_Basins', id: hoveredStateId },
                    { hover: false });
            }
            hoveredStateId = e.features[0].id;
            map.setFeatureState(
                { source: 'CA_Bulletin_118_Groundwater_Basins', id: hoveredStateId },
                { hover: true });
        }
    });
    // When a user moves their mouse out of one of the regions specified in this group
    map.on('mouseleave', 'CA_Bulletin_118_Groundwater_Basins-fills', function () {
        console.log("Left in CA_Bulletin_118_Groundwater_Basins")
    });
    // When a user clicks on one of the regions specified in this group
    map.on('click', 'CA_Bulletin_118_Groundwater_Basins-fills', function (e){
        if (e.features.length == 1){
            region_index = e.features[0].id
            updateInfo();
        }
    });



    // ================== County data, layers (fill and borders), and mouse functions ==================
    map.addSource('CA_Counties_TIGER2016', {
        type: 'geojson',
        data: domain + "download/geojson/CA_Counties_TIGER2016.geojson",
        generateId: true
        });
    map.addLayer({
        'id': 'CA_Counties_TIGER2016-fills',
        'type': 'fill',
        'source': 'CA_Counties_TIGER2016',
        'layout': {'visibility': 'none'},
        'paint': {
            'fill-color': '#088',
            'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.5 ]
        }
    });
    map.addLayer({
        'id': 'CA_Counties_TIGER2016-borders',
        'type': 'line',
        'source': 'CA_Counties_TIGER2016',
        'layout': {'visibility': 'none'},
        'paint': {
            'line-color': '#627BC1',
            'line-width': 2
        }
    });
    // When a user moves their mouse into one of the regions specified in this group
    map.on('mousemove', 'CA_Counties_TIGER2016-fills', function (e) {
        if (e.features.length > 0) {
            if (hoveredStateId !== null) {
                map.setFeatureState(
                    { source: 'CA_Counties_TIGER2016', id: hoveredStateId },
                    { hover: false });
            }
            hoveredStateId = e.features[0].id;
            map.setFeatureState(
                { source: 'CA_Counties_TIGER2016', id: hoveredStateId },
                { hover: true });
        }
    });
    // When a user moves their mouse out of one of the regions specified in this group
    map.on('mouseleave', 'CA_Counties_TIGER2016-fills', function () {
        console.log("Left in CA_Counties_TIGER2016")
    });
    // When a user clicks on one of the regions specified in this group
    map.on('click', 'CA_Counties_TIGER2016-fills', function (e){
        if (e.features.length == 1){
            region_index = e.features[0].id
            updateInfo();
        }
    });



    // ================== Places data, layers (fill and borders), and mouse functions ==================
    map.addSource('CA_Places_TIGER2016', {
        type: 'geojson',
        data: domain + "download/geojson/CA_Places_TIGER2016.geojson",
        generateId: true
        });
    map.addLayer({
        'id': 'CA_Places_TIGER2016-fills',
        'type': 'fill',
        'source': 'CA_Places_TIGER2016',
        'layout': {'visibility': 'none'},
        'paint': {
            'fill-color': '#088',
            'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.5 ]
        }
    });
    map.addLayer({
        'id': 'CA_Places_TIGER2016-borders',
        'type': 'line',
        'source': 'CA_Places_TIGER2016',
        'layout': {'visibility': 'none'},
        'paint': {
            'line-color': '#627BC1',
            'line-width': 2
        }
    });
    // When a user moves their mouse into one of the regions specified in this group
    map.on('mousemove', 'CA_Places_TIGER2016-fills', function (e) {
        if (e.features.length > 0) {
            if (hoveredStateId !== null) {
                map.setFeatureState(
                    { source: 'CA_Places_TIGER2016', id: hoveredStateId },
                    { hover: false });
            }
            hoveredStateId = e.features[0].id;
            map.setFeatureState(
                { source: 'CA_Places_TIGER2016', id: hoveredStateId },
                { hover: true });
        }
    });
    // When a user moves their mouse out of one of the regions specified in this group
    map.on('mouseleave', 'CA_Places_TIGER2016-fills', function () {
        console.log("Left in CA_Places_TIGER2016")
    });
    // When a user clicks on one of the regions specified in this group
    map.on('click', 'CA_Places_TIGER2016-fills', function (e){
        if (e.features.length == 1){
            region_index = e.features[0].id
            updateInfo();
        }
    });



    // ================== Watershed data, layers (fill and borders), and mouse functions ==================
    map.addSource('WBD_USGS_HUC10_CA', {
        type: 'geojson',
        data: domain + "download/geojson/WBD_USGS_HUC10_CA.geojson",
        generateId: true
        });
    map.addLayer({
        'id': 'WBD_USGS_HUC10_CA-fills',
        'type': 'fill',
        'source': 'WBD_USGS_HUC10_CA',
        'layout': {'visibility': 'none'},
        'paint': {
            'fill-color': '#088',
            'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.5 ]
        }
    });
    map.addLayer({
        'id': 'WBD_USGS_HUC10_CA-borders',
        'type': 'line',
        'source': 'WBD_USGS_HUC10_CA',
        'layout': {'visibility': 'none'},
        'paint': {
            'line-color': '#627BC1',
            'line-width': 2
        }
    });
    // When a user moves their mouse into one of the regions specified in this group
    map.on('mousemove', 'WBD_USGS_HUC10_CA-fills', function (e) {
        if (e.features.length > 0) {
            if (hoveredStateId !== null) {
                map.setFeatureState(
                    { source: 'WBD_USGS_HUC10_CA', id: hoveredStateId },
                    { hover: false });
            }
            hoveredStateId = e.features[0].id;
            map.setFeatureState(
                { source: 'WBD_USGS_HUC10_CA', id: hoveredStateId },
                { hover: true });
        }
    });
    // When a user moves their mouse out of one of the regions specified in this group
    map.on('mouseleave', 'WBD_USGS_HUC10_CA-fills', function () {
        console.log("Left in WBD_USGS_HUC10_CA")
    });
    // When a user clicks on one of the regions specified in this group
    map.on('click', 'WBD_USGS_HUC10_CA-fills', function (e){
        if (e.features.length == 1){
            region_index = e.features[0].id
            updateInfo();
        }
    });

});