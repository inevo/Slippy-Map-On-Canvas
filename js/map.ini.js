(function( window, undefined) {
	if(window.slippymap !== undefined){
		window.slippymap.extension.ini = function(map) {
			var ini = {
				prefix : 'slippymap_'+map.div+'_',
				init : function(){
					map.movedListeners.push(ini.update);
					map.zoomedListeners.push(ini.update);
					ini.set();
				},
				set : function() {
					var lon, lat, zoom, storageOK;
					try {
						lon = parseFloat(localStorage.getItem(ini.prefix+"lon"));
						lat = parseFloat(localStorage.getItem(ini.prefix+"lat"));
						zoom = parseFloat(localStorage.getItem(ini.prefix+"zoom"));
						map.recenter(lon, lat, zoom);
					} catch (e) {
						console.log('localStorage: '+e);
					}
				},
				update : function(){
					console.log("localStorage, update");
					var coords = map.pos.getLonLat();
					try {
						localStorage.setItem(ini.prefix+"lon", coords.lon);
						localStorage.setItem(ini.prefix+"lat", coords.lat);
						localStorage.setItem(ini.prefix+"zoom", coords.z);
					} catch (e) {
						console.log('localStorage: '+e);
					}
				}
			}
			return ini;
		}
	}
})(window);
