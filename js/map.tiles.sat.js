document.addEventListener('DOMContentLoaded', function(){
	app = window.app || {};
	app.tiles = app.tiles || {};
	app.tiles.sat = {
		init : function(){
			console.log("changing to sat");
			app.tileprovider = app.tiles.sat.tileprovider;
		},
		tileprovider :	function(x,y,z){
			return "http://khm1.google.com/kh/v=66&x="+x+"&y="+y+"&z="+z;
		}
	};
	app.preInitListeners.push(app.tiles.sat.init);
}, null);