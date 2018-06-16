// check for url parameter to set the view
function UIState(){

  url = new URL(window.location.href);

  //get current map state, update url
  this.lng = url.searchParams.get('lng') || -75.15819172765856;
  this.lat = url.searchParams.get('lat') || 39.94848811327782;
  this.zoom = url.searchParams.get('z') || 13;
  this.division = url.searchParams.get('div') || '';
  // that = this;
  this.update_url = function(){

    //update map_state object
    Object.assign(map_state, map.getCenter());
    this.zoom = map.getZoom();
    url.searchParams.set('lng', Math.round(this.lng * 100000) / 100000);
    url.searchParams.set('lat', Math.round(this.lat * 100000) / 100000);
    url.searchParams.set('z', Math.round(this.zoom * 100) / 100);
    url.searchParams.set('div',map_state.division);
    window.history.pushState('page2', 'Title', url.search);
  }
}


//Initializes the source object - used by AddSource
function InitSource (source, name, type, url) {
	source.name=name;
	source.type=type;
	source.url=url;
}

//Adds the source to the map object
function AddSource (map, source){
	map.addSource(source.name, {
    'type': source.type,
    'url': source.url
	});
}


//initialize a layer
function InitLayer (layer, id, type, source, source_layer, line_color, line_width, fill_color, filter, other){
	layer.id=id;
	layer.type=type;
	layer.source=source;
	layer.source_layer=source_layer;
	layer.paint=new Object();
	layer.paint.line_color=line_color;
	layer.paint.line_width=line_width;
	layer.paint.fill_color=fill_color;
	layer.filter=filter; //the filter is an array
	layer.other=other;
}


//adds a layer to the map - either a fill or line layer  
function AddLayerMap (map, layer) {
	if (layer.type=='fill') {
		map.addLayer({
		  'id': layer.id,
		  'type': layer.type,
		  'source': layer.source,
		  'source-layer':layer.source_layer,
		  'paint': {
		    'fill-color': layer.paint.fill_color,
		  },
		  'filter':layer.filter,
		}, layer.other);
	}
	
	else {
		map.addLayer({
		  'id': layer.id,
		  'type': layer.type,
		  'source': layer.source,
		  'source-layer':layer.source_layer,
		  'paint': {
		    'line-color': layer.paint.line_color,
		    'line-width':layer.paint.line_width,
		  },
		  'filter':layer.filter,
		}, layer.other);
	}
}


//A couple global variables
map_state = new UIState();

//list of layers - these "layers" can both a data layer and a polygon (aka click) layer -- is there a better name for this?
var layernamearray=new Array ('wards', 'divisions');

//initializing status to off
var layerstatus=new Object();
layerstatus.wards=0;
layerstatus.divisions=0;

//wards layer
var wards=new Object;

//divisions layer
var divisions=new Object;

var wards_hover= new Object();
InitLayer (wards_hover, 'wards_hover', 'line', 'phila-wards', 'wards-9rgnox', 	'rgba(106,165,108,1)', 3, '', ["==", "WARD_NUM", ""], 'waterway-label');

//var wards_click - doesn't exist currently...  we should add it!  Maybe some kind of toggle system where you can choose whether to show the division or ward polygon

var divisions_hover = new Object();
InitLayer (divisions_hover, 'divisions_hover', 'fill', 'phila-ward-divisions', 'divisions_cp-3bb6vb', '', 0, 'rgba(33,150,243,0.5)', ["==", "DIVISION_NUM", map_state.division], 'waterway-label');

//this is really a property of the divisions layer...  a shows the division polygon in solid blue  
var divisions_click=new Object();
//this includes a dummy filter "1"=="1" -- as I'm unsure how to add an empty filter
InitLayer (divisions_click, 'divisions_click', 'fill', 'phila-ward-divisions', 'divisions_cp-3bb6vb', '', 0, 'rgba(33,150,243,0.01)', ["==", "1", "1"],'');

//adding hover and click into wards and divisions
wards.hover=wards_hover;
wards.click='';

divisions.hover=divisions_hover;
divisions.click=divisions_click;

var layerarray=new Object();
layerarray.divisions=divisions;
layerarray.wards=wards;

var divisions_source = new Object();
InitSource (divisions_source, 'phila-ward-divisions', 'vector', 'mapbox://aerispaha.0ava9jx8');

var wards_source=new Object();
InitSource (wards_source, 'phila-wards', 'vector', 'mapbox://aerispaha.bto5kb2v');





mapboxgl.accessToken = 'pk.eyJ1IjoiYWVyaXNwYWhhIiwiYSI6ImNpdWp3ZTUwbDAxMHoyeXNjdDlmcG0zbDcifQ.mjQG7vHfOacyFDzMgxawzw';
var map = new mapboxgl.Map({
    style:'mapbox://styles/aerispaha/cj9lvdi8q1yvs2rn24ytindg0',
    center: [map_state.lng, map_state.lat],
    zoom: map_state.zoom,
    container: 'map_wrapper',
});

var overlay = document.getElementById('map-overlay');


map.on('load', function() {
  var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    country: 'us',
    bbox: [-75.280296, 39.867004, -74.955833, 40.137959],
  });
  map.addControl(geocoder);

  //load interactive layers into the map
  /*
  AddSource (map, divisions_source);
  AddSource (map, wards_source);
  AddLayerMap (map, wards_hover);
  AddLayerMap (map, divisions_hover);
  AddLayerMap (map, divisions_click);
  */ 
  layerstatus.wards=1;
  layerstatus.divisions=1;  
  
  //Geocoder point layer
  map.addSource('single-point', {
    "type": "geojson",
    "data": {"type": "FeatureCollection","features": []}
  });
  map.addLayer({
    "id": "point",
    "source": "single-point",
    "type": "circle",
    "paint": {
      "circle-radius": 10,
      "circle-color": "#007cbf"
    }
  });

  // Listen for the `geocoder.input` event that is triggered when a user
  // makes a selection and add a symbol that matches the result.
  geocoder.on('result', function(ev) {
    map.getSource('single-point').setData(ev.result.geometry);
    console.log(ev)
  });

  // When a click event occurs near a polygon, open a popup at the location of
  // the feature, with description HTML from its properties.
  map.on('click','divisions_click',  function (e) {

    console.log(e)
    var features = e.features;//= map.queryRenderedFeatures(e.point, { layers: ['phila-ward-divisions', 'phila-wards'] });
    if (!features.length) {
        map.setFilter("divisions_hover", ["==", "DIVISION_NUM", ""]);
        return;
    }

    for (var i = 0; i < features.length; i++) {
      feature = features[i]
      console.log(feature)

      if (feature.layer.id == 'divisions_click'){

        map.setFilter("divisions_hover", ["==", "DIVISION_NUM", feature.properties.DIVISION_NUM]);

        //update map_state and url params with active division
        map_state.division = feature.properties.DIVISION_NUM;
        map_state.update_url();

        ward = "Ward " + feature.properties.DIVISION_NUM.slice(0, 2);
        div = "Division " + feature.properties.SHORT_DIV_NUM;
        peeps = JSON.parse(feature.properties.committeepeople);
        peep_data = [];
        for (var i = 0; i < peeps.length; i++) {
          p = peeps[i]
          com_person_str = p['FULL NAME'];
          peep_data.push(com_person_str)
        }
        peep_data = peep_data.join('<br>')


        // console.log(peeps);
        title = '<h4>' + ward + ' ' + div + '</h4>';
        var html_message = [title, 'Committee People:', peep_data];

        var popup = new mapboxgl.Popup()
            .setLngLat(map.unproject(e.point))
            .setHTML(html_message.join('<br>'))
            .addTo(map);
        }
    }

    });
    // Use the same approach as above to indicate that the symbols are clickable
    // by changing the cursor style to 'pointer'
    map.on('mousemove', function (e) {
        var features = map.queryRenderedFeatures(e.point, { layers: ['divisions_click'] });
        map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    });

});

map.on('moveend', function(ev) {
    //update map_state object after moving the view
    map_state.update_url();
});


//Should it toggle the layer, or set its status
//This version sets the layer's status to 1 or 0
//layerarray - array of possible layer names -- hmm
//layerstatus - array of layer status
function ToggleLayer(layer, status, layernamearray, layerarray, layerstatus) {

	//if layer exists
	if (layernamearray.indexOf(layer)!=-1)	{
		//if the layer is on and we're removing it
		if ((layerstatus[layer]==1) && (status==0)) {
			
			//need to modify this so it works.
			 map.setLayoutProperty(layer, 'visibility', 'none');
		}
		
		//if the layer is off and we're adding it
		else if ((layerstatus[layer]==0) && (status==1)) {
			
			//add hover layer	
			AddLayerMap (map, layerarray[layer].hover);
			
			//add click layer if applicable
		 if (layerarray[layer].click.id !=undefined) {
			 AddLayerMap (map, layerarray[layer].click); 
		 }
		 
		 //set layerstatus
		 layerstatus[layer]=status;
		}
	}
	//cancels the opening of a new page from the clicking of an <a> link
	return false;
}