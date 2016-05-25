var app = {
	init: function(){
		app.createMap();
	},
	createMap: function() {
		window.onload = function() {
			var lat = document.getElementsByTagName("html")[0].getAttribute("data-lat"); 
			var lon = document.getElementsByTagName("html")[0].getAttribute("data-lon"); 
			var options = {				
				center: [lat,lon],
				zoom: 12,
				touchZoom: false,
				scrollWheelZoom: false,
				zoomControl: false,
				doubleClickZoom: false,
				boxZoom: false,
				attributionControl: false,
				dragging: false
			};
			var homicideMap = new L.Map('homicideMap', options);
			L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
				attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
			}).addTo(homicideMap);								
			var mainlayers = [];
			var sublayers = [];
			var layerSource = {
				user_name: 'baltsun',
				type: 'cartodb',
				sublayers: [{
					sql: "SELECT * FROM shootings_near_you_ob_gva",
					cartocss: '#md_shootings_near_you[killed=0]{marker-fill-opacity: 1;'+
						'marker-line-color: #daa520;'+
						'marker-line-width: 1;'+
						'marker-line-opacity: 1;'+
						'marker-placement: point;'+
						'marker-type: ellipse;'+
						'marker-width: 4;'+
						'marker-fill: #fff;'+
						'marker-allow-overlap: true;'+
						'[zoom>13]{marker-width: 8;}}'+
						'#md_shootings_near_you[killed!=0]{marker-fill-opacity: 1;'+
						'marker-line-color: #900020;'+
						'marker-line-width: 1;'+
						'marker-line-opacity: 1;'+
						'marker-placement: point;'+
						'marker-type: ellipse;'+
						'marker-width: 4;'+
						'marker-fill: #fff;'+
						'marker-allow-overlap: true;'+
						'[zoom>13]{marker-width: 8;}}'
				}]
			};
			// For storing the sublayers
			mainlayers = [];			
			// Add data layer to your homicideMap
			cartodb.createLayer(homicideMap,layerSource, 
				{
					cartodb_logo: false
				})
				.addTo(homicideMap)
				.error(function(err) {
					console.log("error: " + err);
				});
			var radius, marker;
			function createProximityMap() {
				var latlng = L.latLng(lat, lon);
				radius = new L.circle(latlng, 1609, {
					color: '#DAA520',
					fillColor: '#DAA520',
					fillOpacity: .1
				}).addTo(homicideMap);
				radius.bringToBack();
				marker = L.circleMarker(latlng, {
					stroke: false,
					fillColor: '#DAA520',
					fillOpacity: .5
				}).addTo(homicideMap);
				var shootingsSQL = "SELECT * FROM shootings_near_you_ob_gva WHERE killed = 0 AND ST_Distance(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")', 4326), true) < 1609"
				var homicidesSQL = "SELECT * FROM shootings_near_you_ob_gva WHERE killed != 0 AND ST_Distance(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")', 4326), true) < 1609"
				var viewLat = parseFloat(lat) - .005;
				var viewLon = parseFloat(lon);
				var zoomLvl = 13;
				homicideMap.setView([viewLat, viewLon], zoomLvl, {animation: true});
				countPoints(shootingsSQL, homicidesSQL);					
			};
			function countPoints(shootingsSQL, homicidesSQL) {
				var incidentsCount = 0;
				var homicidesCount = 0;
				$.getJSON('https://baltsun.cartodb.com/api/v2/sql/?q='+shootingsSQL, function(data) {
					$.each(data.rows, function(key, val) {
						incidentsCount++;
					});					
					$.getJSON('https://baltsun.cartodb.com/api/v2/sql/?q='+homicidesSQL, function(data) {
						$.each(data.rows, function(key, val) {
							homicidesCount += val.killed;
							incidentsCount++;
						});
						if (incidentsCount == 1) {
							$('.incidentsPlural').hide();
						} else {
							$('.incidentsPlural').show();
						};
						$('.incidentsNumber').text(incidentsCount);
						$('.homicidesNumber').text(homicidesCount);
					});
				});
			};
			createProximityMap();
		};
	}
}
$(document).ready(function(){
	app.init();
});