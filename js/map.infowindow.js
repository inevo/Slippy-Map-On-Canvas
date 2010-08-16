(function (window) {
    if (typeof window.slippymap !== 'undefined') {
        window.slippymap.extension.infowindow = function (map) {
            var infowindow = {
            	init : function(){
					if(!document.getElementById("overlay")){
						var overlay = document.createElement("div");
						overlay.id = "overlay";
						document.getElementsByTagName("body")[0].appendChild(overlay);
					};
				},   
				getMarkerAt: function (x, y) {
                	// bbox left,bottom,right,top
                	var found = {};
                	for (var m in map.markers) {
						if (map.markers.hasOwnProperty(m)) {
                			if(map.markers[m].bbox){
                				var bbox = map.markers[m].bbox;
                				if(x >= bbox[0] && x<= bbox[2] && y >= bbox[3] && y <= bbox[1]){
                					found[m] = map.markers[m];
                				}
                			}
                		}
                	}
                	return found;
                },
				featureInfo : function (event){
					if (!event) {
						event = window.event;
					}
					var x = event.clientX - document.getElementById("map").offsetLeft;
					var y = event.clientY - document.getElementById("map").offsetTop;
					var found = infowindow.getMarkerAt(x,y);
					for (var m in found) {
						if (found.hasOwnProperty(m)) {
							infowindow.showInfo(x,y,found[m],m);
						}
					}
				},
				showInfo : function(x,y,marker,id) {
					var info = document.createElement("div");
					info.innerHTML = "<div>" + (marker.html || marker.name || id) + "</div>";
					info.setAttribute("class", "info");
					info.style.position = 'absolute';
					info.style.top = (y)+'px';
					info.style.left = (x)+'px';
					info.onclick = function(){
						this.style.display = "none";
					}
					document.getElementById("overlay").appendChild(info);
				},
				clearInfo : function (){
					document.getElementById("overlay").innerHTML = '';
				}
            };
            return infowindow;
        };
    }
})(window);