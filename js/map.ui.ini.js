document.addEventListener('DOMContentLoaded', function(){
	app = window.app || {};
	app.ini = app.ini || {
		init : function(){
			app.movedListeners.push(app.ini.update);
			app.zoomedListeners.push(app.ini.update);
			app.postInitListeners.push(app.ini.set);
		},
		set : function() {
			var lon, lat, zoom;
			try {
				var lon = parseFloat(localStorage.getItem("lon"));
				var lat = parseFloat(localStorage.getItem("lat"));
				var zoom = parseInt(localStorage.getItem("zoom"));
				var storageOK = true;
			} catch (e) {
				console.log('localStorage: '+e);
				var storageOK = false;
			}
			if(storageOK && zoom > 0 && lon > -180 && lon < 180 && lat > -85 && lat < 85) {
				if(zoom) app.recenter(lon, lat, zoom);
			}
		},
		update : function(){
			var coords = app.pos.getLonLat();
			try {
				localStorage.setItem("lon", coords[0]);
				localStorage.setItem("lat", coords[1]);
				localStorage.setItem("zoom", coords[2]);
			} catch (e) {
				console.log('localStorage: '+e);
			}
		}
	}
	app.ini.init();
}, null);
