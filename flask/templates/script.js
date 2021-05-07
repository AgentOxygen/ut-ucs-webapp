// Default initial parameters
console.log("Setting default parameters...")
var domain = document.location;
var current_rcp = 4.5;
var current_models = [];
var current_metric = "";
var current_geojson = "";

// All information panes to the left of the map
let panes = ["primary-pane", "choose-models-pane", "choose-metric-pane"];

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


// Sets selected RCP to RCP 4.5
function setRCP45() {
    console.log("Switching to RCP 4.5")
    document.getElementById('rcp85-checkbox').checked = false;
    current_rcp = 4.5;
}


// Sets selected RCP to RCP 8.5
function setRCP85() {
    console.log("Switching to RCP 8.5")
    document.getElementById('rcp45-checkbox').checked = false;
    current_rcp = 8.5;
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
}


// Initiates information update with model selections and shifts focus back to primary pane
function buttonChangeModels(){
    focusOnPane("primary-pane");
}


/* ===================================== Mapbox API ===================================== */

// Mapbox API token
mapboxgl.accessToken = 'pk.eyJ1Ijoib3h5Z2VuMSIsImEiOiJja25jMmh3b28wenFlMnFvaGowN3B6bmc1In0.MKaFBCRkpp4gZWA3hIT-iA';

// Mapbox Map stuff
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-122.486052, 37.830348],
    zoom: 4.9
});
var hoveredStateId  = null;

map.on('load', function () {
    map.addSource('regions',
        {
        type: 'geojson',
        data: domain + "download/geojson/CA_Bulletin_118_Groundwater_Basins.geojson",
        generateId: true
        });
    map.addLayer({
        'id': 'region-fills',
        'type': 'fill',
        'source': 'regions',
        'paint': {
            'fill-color': '#088',
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,
                0.5
            ]
        }
    });

    map.addLayer({
        'id': 'region-borders',
        'type': 'line',
        'source': 'regions',
        'layout': {},
        'paint': {
            'line-color': '#627BC1',
            'line-width': 2
        }
    });
    // When the user moves their mouse over the region-fill layer, we'll update the
    // feature state for the feature under the mouse.
    map.on('mousemove', 'region-fills', function (e) {
        //console.log(e.features[0]['properties']['OBJECTID'])
        if (e.features.length > 0) {
            if (hoveredStateId) {
                map.setFeatureState({ source: 'regions', id: hoveredStateId  }, { hover: false });
            }
            document.getElementById('basin_name').innerHTML = e.features[0].properties.Basin_Subbasin_Name;
            hoveredStateId  = e.features[0].id;
            map.setFeatureState({ source: 'regions', id: hoveredStateId  }, { hover: true } );
        }
    });

    // When the mouse leaves the region-fill layer, update the feature state of the
    // previously hovered feature.
    map.on('mouseleave', 'region-fills', function () {
        if (hoveredStateId) {
            map.setFeatureState({ source: 'regions', id: hoveredStateId  }, { hover: false } );
        }
        hoveredStateId  = null;
    });

    // When a click event occurs on a feature in the states layer, open a popup at the
    // location of the click, with description HTML from its properties.
    map.on('click', 'region-fills', function (e){
        document.getElementById('basin_chosen').innerHTML = e.features[0].properties.Basin_Subbasin_Name;
        document.getElementById('basin_globalid').innerHTML = "Basin Name: " + e.features[0].properties.Basin_Subbasin_Name + "</br>Global ID: " + e.features[0].properties.GlobalID;
        region_name = e.features[0].properties.Basin_Subbasin_Name;
        checkForUpdate();
    });
});