(function( window, undefined) {
	if(window.slippymap !== undefined){
		window.slippymap.extension.tiles = slippymap.extension.google || {};
		window.slippymap.extension.tiles.gmap = function(map) {
			return {
				init : function(){
					map.tileprovider =	function(x,y,z){
						return "http://mt1.google.com/vt/x="+x+"&y="+y+"&z="+z;
					}
				}
			}
		}
	}
})(window);
