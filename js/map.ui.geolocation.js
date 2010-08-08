document.addEventListener('DOMContentLoaded', function(){
	app = window.app || {};
	app.gps = app.gps || {
		lastUpdate : 0,
		init : function () {
			try {
				var gl = navigator.geolocation;
				console.log("found native geolocation");
			} catch (e_nogeolocation) {
				try {
					var gl = google.gears.factory.create('beta.geolocation');
					console.log("no geolocation, using gears");
				} catch (e_nogears) {
					console.log("no geolocation or gears plugin found");
				}
			}
			return gl;
		},
		location: function () {
			var gl;
			if(gl = app.gps.init()) {
				try {
					gl.getCurrentPosition(app.gps.displayPosition, app.gps.displayError);
				} catch (e) {
					console.log(e);
				}
			}
		},
		displayError: function (error) {
			console.log("no location");
		},
		displayPosition: function (position) {
		 	var now = function(){
				return (new $.Date()).getTime();
			}
			var metersPerPixel = [156412,78206,39103,19551,9776,4888,2444,1222 ,611,305,153,76,38,19,10,5,2,1,0.6];
			if(position.coords && position.coords.accuracy){
				for(var z=0; z<17 && metersPerPixel[z]*$.app.renderer.tilesize > position.coords.accuracy; z++){}
				app.recenter(position.coords.longitude, position.coords.latitude, z);
			} else {
				app.recenter(position.coords.longitude, position.coords.latitude);
			}
			app.gps.lastUpdate = now();
		}
	}
}, null);
