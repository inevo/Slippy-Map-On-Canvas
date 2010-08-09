document.addEventListener('DOMContentLoaded', function(){
	app = window.app || {};
	app.ui = app.ui || {};
	app.ui.geolocation = app.ui.geolocation || {
		gl : {
			getCurrentPosition: function(){
				console.log("no supported geolocation services found");
			}
		},
		lastUpdate : 0,
		init : function () {
			try {
				app.ui.geolocation.gl = navigator.geolocation;
				console.log("found native geolocation");
			} catch (e_nogeolocation) {
				try {
					app.ui.geolocation.gl = google.gears.factory.create('beta.geolocation');
					console.log("no geolocation, using gears");
				} catch (e_nogears) {
					console.log("no geolocation or gears plugin found",e_nogears);
				}
			}
		},
		location: function () {
			console.log("dispatch getCurrentPosition");
			try {
				document.getElementById("geo").setAttribute("dispatched", true);
			} catch (e){};
			app.ui.geolocation.gl.getCurrentPosition(
				window.app.ui.geolocation.displayPosition,
				window.app.ui.geolocation.displayError,
				{maximumAge:600000, timeout:3000, enableHighAccuracy: false, responseTime: 2}
			);
		},
		displayError: function (error) {
			console.log("getCurrentPosition error: "+( error.message || " - "));
			try {
				document.getElementById("geo").removeAttribute("dispatched");
				document.getElementById("geo").setAttribute("error", true);
			} catch (e){};
		},
		displayPosition: function (position) {
		 	var now = function(){
				return (new Date()).getTime();
			}
			var metersPerPixel = [156412,78206,39103,19551,9776,4888,2444,1222 ,611,305,153,76,38,19,10,5,2,1,0.6];
			if(position.coords && position.coords.accuracy){
				for(var z=0; z<17 && metersPerPixel[z]*app.renderer.tilesize > position.coords.accuracy; z++){}
				if(z){
					app.recenter(position.coords.longitude, position.coords.latitude, z);
				} else {
					app.recenter(position.coords.longitude, position.coords.latitude);			
				}
			} else {
				app.recenter(position.coords.longitude, position.coords.latitude);
			}
			app.ui.geolocation.lastUpdate = now();
			try {
				document.getElementById("geo").removeAttribute("dispatched");
			} catch (e){};
		}
	}
	app.preInitListeners.push(app.ui.geolocation.init);
}, null);
