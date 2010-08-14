(function( window, undefined) {
	if(window.slippymap !== undefined){
		window.slippymap.extension.tiles = slippymap.extension.google || {};
		window.slippymap.extension.tiles.gsat = function(map) {
			return {
				init : function(){
					map.tileprovider =	function(x,y,z){
						return "http://khm1.google.com/kh/v=66&x="+x+"&y="+y+"&z="+z;
					}
				}
			}
		}
	}
})(window);
