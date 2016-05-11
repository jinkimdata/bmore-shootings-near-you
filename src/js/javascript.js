var bmoreShootings = {
	init: function(){
		bmoreShootings.createMap();
	},
	createMap: function() {
		window.onload = function() {
			var isMobile = bmoreShootings.otherMobileFix();
			var lat = document.getElementsByTagName("html")[0].getAttribute("data-lat"); 
			var lon = document.getElementsByTagName("html")[0].getAttribute("data-lon"); 
			var options = {				
				center: [lat, lon],
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
					sql: "SELECT * FROM bmore_shootings",
					cartocss: '#bmore_shootings{marker-fill-opacity: 1;'+
						'marker-line-color: #daa520;'+
						'marker-line-width: 1;'+
						'marker-line-opacity: 1;'+
						'marker-placement: point;'+
						'marker-type: ellipse;'+
						'marker-width: 2;'+
						'marker-fill: #fff;'+
						'marker-allow-overlap: true;'+
						'[zoom>13]{marker-width: 6;}}'
				}, {
					sql: "SELECT * FROM bmore_homicides",
					cartocss: '#bmore_homicides{marker-fill-opacity: 1;'+
						'marker-line-color: #900020;'+
						'marker-line-width: 1;'+
						'marker-line-opacity: 1;'+
						'marker-placement: point;'+
						'marker-type: ellipse;'+
						'marker-width: 2;'+
						'marker-fill: #fff;'+
						'marker-allow-overlap: true;'+
						'[zoom>13]{marker-width: 6;}}'
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
				.done(function(layer) {
					for (var i = 0; i < layer.getSubLayerCount(); i++) {
						mainlayers[i] = layer.getSubLayer(i);
					}; 					
					mainlayers[1].setInteractivity('location, crimedate, weapon');						
					mainlayers[0].setInteractivity('location, crimedate');						
					var homicidesTooltip = layer.leafletMap.viz.addOverlay({
						type: 'infobox',
						layer: mainlayers[1],
						template:'<div class="homicidesInfobox">'+
							'<p>{{location}}</p>'+
							'<p>KILLED: {{crimedate}}</p>'+
							'<p>WEAPON: {{weapon}}</p></div>',
						width: 208,
						fields: [{
							location: 'location',
							crimedate: 'crimedate',
							weapon: 'weapon'
						}]
					});
					var shootingsTooltip = layer.leafletMap.viz.addOverlay({
						type: 'infobox',
						layer: mainlayers[0],
						template:'<div class="shootingsInfobox">'+
							'<p>{{location}}</p>'+
							'<p>SHOT: {{crimedate}}</p></div>',
						width: 208,
						fields: [{
							location: 'location',
							crimedate: 'crimedate'
						}]
					});
					$('.infobox--homicides').append(homicidesTooltip.render().el);
					$('.infobox--shootings').append(shootingsTooltip.render().el);
					var zoomLvl = 12;
					if (isMobile) {
						zoomLvl -= 1;
					}
					homicideMap.setView([lat, lon], zoomLvl);
				})
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
				var shootingsSQL = "SELECT * FROM bmore_shootings WHERE ST_Distance(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")', 4326), true) < 1609"
				var homicidesSQL = "SELECT * FROM bmore_homicides WHERE ST_Distance(the_geom, ST_GeomFromText('POINT("+lon+" "+lat+")', 4326), true) < 1609"
				var viewLat = parseFloat(lat);
				var viewLon = parseFloat(lon);
				var zoomLvl = 14;
				if (!isMobile) {
					viewLon += .009;
				} else {
					viewLat -= .009;
					zoomLvl -= 1;
				};
				homicideMap.setView([lat, lon], zoomLvl, {animation: true});
				countPoints(shootingsSQL, homicidesSQL);					
			};
			function countPoints(shootingsSQL, homicidesSQL) {
				var shootingsCount = 0;
				var homicidesCount = 0;
				$.getJSON('https://baltsun.cartodb.com/api/v2/sql/?q='+shootingsSQL, function(data) {
					$.each(data.rows, function(key, val) {
						shootingsCount++;
					});
					$('.shootingsNumber').text(shootingsCount);
				});
				$.getJSON('https://baltsun.cartodb.com/api/v2/sql/?q='+homicidesSQL, function(data) {
					$.each(data.rows, function(key, val) {
						homicidesCount++;
					});
					$('.homicidesNumber').text(homicidesCount);
				});
			};
			createProximityMap();
		};
	},
	mobileCheck: function() {
		var isMobile = false;
		if ($(window).width() < 600) {
			isMobile = true;
		};
		return isMobile;
	},
	otherMobileFix: function() {		
		var isMobile = false;		
		if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
		|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) isMobile = true;   
	    return isMobile;
	}
}
$(document).ready(function(){
	bmoreShootings.init();
	console.log("connected");
});