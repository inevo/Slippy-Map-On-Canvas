document.addEventListener('DOMContentLoaded', function(){
	app = window.app || {};
	app.tiles = app.tiles || {};
	app.tiles.google = app.tiles.google || {};
	app.tiles.google.map = {
		init : function(){
			console.log("changing to google map tiles");
			app.tileprovider = app.tiles.google.map.tileprovider;
		},
		tileprovider :	function(x,y,z){
			return "http://mt1.google.com/vt/x="+x+"&y="+y+"&z="+z;
		}
	};
	app.preInitListeners.push(app.tiles.google.map.init);
}, null);