/*  Slippy Map on Canvas - HTML5
 *
 *  Copyright 2010 dFacts Network
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *
 *  based on/ inspired by Tim Hutt, http://concentriclivers.com/slippymap.html
 *  added features like touch support, fractional zoom, markers ...
 */
 
(function ($, div, z, x, y, markers, tileprovider) {
    $.app = {
        init: function () {
            var viewportWidth = $.innerWidth,
                viewportHeight = $.innerHeight;
            for (var i = 0; i < $.app.preInitListeners.length; i++) {
				$.app.preInitListeners[i]();
			}
            $.app.pos.x = $.app.pos.lon2posX(x);
            $.app.pos.y = $.app.pos.lat2posY(y);
            $.app.pos.z = z;
            $.app.renderer.canvas = $.document.getElementById(div);
            $.app.renderer.canvas.width = viewportWidth;
            $.app.renderer.canvas.height = viewportHeight;
            $.app.renderer.context = $.app.renderer.canvas.getContext("2d");
			$.app.renderer.sortLayers();
            $.app.renderer.refresh();
            $.app.events.init();
            for (var i = 0; i < $.app.postInitListeners.length; i++) {
				$.app.postInitListeners[i]();
			}
        },
        preInitListeners : [],
        postInitListeners : [],
        markers : markers || {
        },
        tracks : {
        },
        tileprovider : tileprovider || function (x, y, z) {
            var rand = function (n) {
            	return $.Math.floor($.Math.random() * n);
            };
            var sub = ["a", "b", "c"];
            var url = "http://" + sub[rand(3)] + ".tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png";
            return url;
        },
        useFractionalZoom : true,
        zoomIn: function (step, round) {
            if ($.app.pos.z < $.app.renderer.maxZ) {
                $.app.pos.z += step || 1;
                if(round !== false) {
                	$.app.pos.z = $.Math.round($.app.pos.z);
                }
                if($.app.pos.z > $.app.renderer.maxZ) {
                	$.app.pos.z = $.app.renderer.maxZ;
                }
                $.app.renderer.refresh();
                $.app.zoomed();
            }
        },
        zoomOut: function (step, round) {
            if ($.app.pos.z > 0) {
                $.app.pos.z -= step || 1;
                if(round !== false) {
                	$.app.pos.z = $.Math.round($.app.pos.z);
                }
                if($.app.pos.z<0) {
                	$.app.pos.z = 0;
                }
                $.app.renderer.refresh();
                $.app.zoomed();
            }
        },
        recenter: function(lon,lat,zoom){
            $.app.pos.x = $.app.pos.lon2posX(lon);
            $.app.pos.y = $.app.pos.lat2posY(lat);
            if(zoom>=0) $.app.pos.z = zoom;
            $.app.renderer.refresh();        
        },
        /* keep track of zoom + pans */
        zoomed: function() {
			for (var i = 0; i < $.app.zoomedListeners.length; i++) {
				$.app.zoomedListeners[i]();
			}
        },
        zoomedListeners : [],
        moved: function() {
			for (var i = 0; i < $.app.movedListeners.length; i++) {
				$.app.movedListeners[i]();
			}
        },
        movedListeners : [],
        resized: function () {
            var viewportWidth = $.innerWidth,
                viewportHeight = $.innerHeight;
            $.app.renderer.canvas.width = viewportWidth;
            $.app.renderer.canvas.height = viewportHeight;
            $.app.renderer.refresh();
        },
        /* events */
        events: {
            lastMouseX: 0,
            lastMouseY: 0,
            dragging: false,
            lastTouchEvent: {},
            lastTouchEventBeforeLast: {},
            mouseDown: function (event) {
                if (!event) {
                    event = $.event;
                }
                var x = event.clientX - $.app.renderer.canvas.offsetLeft;
                var y = event.clientY - $.app.renderer.canvas.offsetTop;
                if (event.button === 0) {
                    $.app.events.dragging = true;
                }
                $.app.events.lastMouseX = x;
                $.app.events.lastMouseY = y;
            },
            mouseMove: function (event) {
                if (!event) {
                    event = $.event;
                }
                var x = event.clientX - $.app.renderer.canvas.offsetLeft;
                var y = event.clientY - $.app.renderer.canvas.offsetTop;
                if ($.app.events.dragging === true) {
                    var dX = x - $.app.events.lastMouseX;
                    var dY = y - $.app.events.lastMouseY;
                    $.app.pos.x -= dX * $.Math.pow(2, $.app.renderer.maxZ - $.app.pos.z);
                    $.app.pos.y -= dY * $.Math.pow(2, $.app.renderer.maxZ - $.app.pos.z);
                    $.app.renderer.refresh();
                    $.app.moved();
                }
                $.app.events.lastMouseX = x;
                $.app.events.lastMouseY = y;
            },
            mouseUp: function () {
                $.app.events.dragging = false;
            },
            mouseOut: function () {
                $.app.events.dragging = false;
            },
            mouseWheel: function (event) {
                var delta = 0;
                if (!event) {
                    event = $.event;
                }
                if (event.wheelDelta) {
                    delta = event.wheelDelta / 120;
                    if ($.opera) {
                        delta = -delta;
                    }
                }
                else if (event.detail) {
                    delta = -event.detail / 3;
                }
                if (delta > 0) {
                    $.app.zoomIn(delta/100, false);
                    $.app.zoomed();

                } else if (delta < 0) {
                    $.app.zoomOut(-delta/100, false);
                    $.app.zoomed();
                }
            },
            doubleClick: function (event) {
                if (!event) {
                    event = $.event;
                }
                var x = event.clientX - $.app.renderer.canvas.offsetLeft;
                var y = event.clientY - $.app.renderer.canvas.offsetTop;
                var dX = x - $.app.renderer.canvas.width / 2;
                var dY = y - $.app.renderer.canvas.height / 2;
                $.app.pos.x += dX * $.Math.pow(2, $.app.renderer.maxZ - $.app.pos.z);
                $.app.pos.y += dY * $.Math.pow(2, $.app.renderer.maxZ - $.app.pos.z);
                $.app.events.lastMouseX = x;
                $.app.events.lastMouseY = y;
                $.app.zoomIn(1, true);
            },
            /* maps touch events to mouse events */
            touchHandler: function (event) {
                var now = function(){
                    return (new $.Date()).getTime();
                }
                var touches = event.targetTouches,
                    type, first = touches[0];
                if (touches.length === 1) {
                    switch (event.type) {
                    case 'touchstart':
                        type = 'mousedown';
                        break;
                    case 'touchmove':
                        type = 'mousemove';
                        break;
                    case 'touchend':
                        type = 'mouseup';
                        break;
                    default:
                        return;
                    }
                    if ($.app.events.lastTouchEventBeforeLast && 
                        event.type == 'touchend' && 
                        $.app.events.lastTouchEventBeforeLast.type == 'touchend' && 
                        event.x == $.app.events.lastTouchEventBeforeLast.x && 
                        event.y == $.app.events.lastTouchEventBeforeLast.y && 
                        now() - $.app.events.lastTouchEventBeforeLast.timeStamp < 500) {
                        $.app.events.lastTouchEventBeforeLast = false;
                        $.app.events.lastTouchEvent.timeStamp = now();
                        type = 'dblclick';
                    }
                    var simulatedEvent = document.createEvent('MouseEvent');
                    simulatedEvent.initMouseEvent(type, true, true, $, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/ , null);
                    first.target.dispatchEvent(simulatedEvent);
    	            $.app.events.lastTouchEventBeforeLast = $.app.events.lastTouchEvent;
	                $.app.events.lastTouchEvent = event;
                }
                if (event.preventDefault) {
                    event.preventDefault();
                }
            },
            /* minimal pinch support */
            gestureHandler: function (event) {
                if (event.scale) {
                    if (event.scale > 1) {
                        $.app.zoomIn((event.scale-1)/10, false);
                        return true;
                    }
                    if (event.scale < 1) {
                        $.app.zoomOut(event.scale/10, false);
                        return true;
                    }
                }
                if (event.preventDefault) {
                    event.preventDefault();
                }
            },
            /* attaches events to map + window */
            init: function () {
                $.addEventListener('resize', $.app.resized, false);
                $.addEventListener('DOMMouseScroll', $.app.events.mouseWheel, false);
                $.addEventListener('mousewheel', $.app.events.mouseWheel, false);
                $.addEventListener('mouseout', $.app.events.mouseOut, false);
                $.app.renderer.canvas.addEventListener('mousedown', $.app.events.mouseDown, false);
                $.app.renderer.canvas.addEventListener('mousemove', $.app.events.mouseMove, false);
                $.app.renderer.canvas.addEventListener('mouseup', $.app.events.mouseUp, false);
                $.app.renderer.canvas.addEventListener('mouseout', $.app.events.mouseOut, false);
                $.app.renderer.canvas.addEventListener('dblclick', $.app.events.doubleClick, false);
                $.app.renderer.canvas.addEventListener('touchstart', $.app.events.touchHandler, false);
                $.app.renderer.canvas.addEventListener('touchmove', $.app.events.touchHandler, false);
                $.app.renderer.canvas.addEventListener('touchend', $.app.events.touchHandler, false);
                $.app.renderer.canvas.addEventListener('touchcancel', $.app.events.touchHandler, false);
                $.app.renderer.canvas.addEventListener('gesturestart', $.app.events.gestureHandler, false);
                $.app.renderer.canvas.addEventListener('gesturechange', $.app.events.gestureHandler, false);
                $.app.renderer.canvas.addEventListener('gestureend', $.app.events.gestureHandler, false);
            }
        },
        /* renderer */
        renderer: {
            canvas: {},
            context: {},
            maxZ: 18,
            lastRenderTime: 0,
            tiles: {},
            tilecount: 0,
            tilesize: 256,
			addLayer : function (layer) {
				var id = layer.id;
				$.app.renderer.layers.push(layer);
				$.app.renderer.sortLayers();
			},
			sortLayers : function () {
				function sortZIndex(a, b) {
					var x = a.zindex;
					var y = b.zindex;
					return ((x < y) ? -1 : ((x > y) ? 1 : 0));
				}
				$.app.renderer.layers.sort(sortZIndex);
			},
            layers :  [
				{
					/* repaint canvas, load missing images */
					id: 'tiles',
					zindex: 0,
					update : true,
					visible : true,
					callback :
					function(id, zi, zf, zp, sz, xMin, xMax, yMin, yMax, tilesize, offsetX, offsetY){
						var maxTileNumber = $.Math.pow(2,zi)-1;
						var tileDone = [];
						var encodeIndex = function (x, y, z) {
							return x + "," + y + "," + z;
						};
						for (var x = $.Math.floor(xMin / sz); x < $.Math.ceil(xMax / sz); ++x) {
							tileDone[x] = [];
							for (var y = $.Math.floor(yMin / sz); y < $.Math.ceil(yMax / sz); ++y) {
								tileDone[x][y] = false;
								var xoff = $.Math.round((x * sz - xMin) / zp * zf)-offsetX;
								var yoff = $.Math.round((y * sz - yMin) / zp * zf)-offsetY;
								
								var tileKey = encodeIndex(x, y, zi);
								if(x>maxTileNumber || y>maxTileNumber || x<0 || y<0){
									$.app.renderer.context.fillStyle = "#dddddd";
									$.app.renderer.context.fillRect(xoff, yoff, tilesize, tilesize);
									tileDone[x][y] = true;
								} else {
									if ($.app.renderer.tiles[tileKey] && $.app.renderer.tiles[tileKey].complete) {
										try {
											$.app.renderer.context.drawImage($.app.renderer.tiles[tileKey], xoff, yoff, tilesize, tilesize);
											$.app.renderer.tiles[tileKey].lastDrawnId = id;
										} catch (e) {
											$.app.renderer.context.fillStyle = "#00ff00";
											$.app.renderer.context.fillRect(xoff, yoff, tilesize, tilesize);
										}
										tileDone[x][y] = true;
									} else {
										var tileAboveX = $.Math.floor(x/2);
										var tileAboveY = $.Math.floor(y/2);
										var tileAboveZ = zi-1;
										var tilePartOffsetX = $.Math.ceil(x-tileAboveX*2);
										var tilePartOffsetY = $.Math.ceil(y-tileAboveY*2);
										var tileKeyAbove = encodeIndex(tileAboveX, tileAboveY, tileAboveZ);
										if ($.app.renderer.tiles[tileKeyAbove] && $.app.renderer.tiles[tileKeyAbove].lastDrawnId){
											var tileOffsetX = xoff-tilePartOffsetX*tilesize;
											var tileOffsetY = yoff-tilePartOffsetY*tilesize;
											try {
												$.app.renderer.context.drawImage($.app.renderer.tiles[tileKeyAbove], tileOffsetX, tileOffsetY,$.Math.ceil(2*tilesize), $.Math.ceil(2*tilesize));	
												$.app.renderer.tiles[tileKeyAbove].lastDrawnId = id;
											} catch(e){
												$.app.renderer.context.fillStyle = "#dddddd";
												$.app.renderer.context.fillRect(tileOffsetX, tileOffsetY,$.Math.ceil(2*tilesize), $.Math.ceil(2*tilesize));	
											}
											tileDone[tileAboveX*2] = tileDone[tileAboveX*2] || []
											tileDone[tileAboveX*2][tileAboveY*2] = true;
											tileDone[tileAboveX*2][tileAboveY*2+1] = true;
											tileDone[tileAboveX*2+1] = tileDone[tileAboveX*2+1] || []
											tileDone[tileAboveX*2+1][tileAboveY*2+1] = true;
											tileDone[tileAboveX*2+1][tileAboveY*2+1] = true;
	
										} else {
											if(!tileDone[x][y]){
												$.app.renderer.context.fillStyle = "#dddddd";
												$.app.renderer.context.fillRect(xoff, yoff, tilesize, tilesize);
												tileDone[x][y] = true;
											}
										}
										if (!$.app.renderer.tiles[tileKey]) {
											$.app.renderer.tiles[tileKey] = new Image();
											$.app.renderer.tiles[tileKey].lastDrawnId = 0;
											$.app.renderer.tilecount++;
											$.app.renderer.tiles[tileKey].src = $.app.tileprovider(x, y, zi, $.app.renderer.tiles[tileKey]);
											$.app.renderer.tiles[tileKey].onload = $.app.renderer.refresh;
											$.app.renderer.tiles[tileKey].onerror = $.app.renderer.refresh;											
										}
									}
								}
							}
						}
					}   
				},
				{
					id: 'markers',
					zindex: 99,
					update : function(){
						if($.app.markers && $.app.markers.length){
							return true;
						}
						return false;
					},
					visible : true,
					callback :
					function(id, zi, zf, zp, sz, xMin, xMax, yMin, yMax, tilesize, offsetX, offsetY){
						for(var marker in $.app.markers){
							if($.app.markers[marker].img && $.app.markers[marker].img.complete){
								x = $.Math.round(($.app.pos.lon2posX($.app.markers[marker].lon)-xMin) / zp * zf) + $.app.markers[marker].offsetX - offsetX;
								y = $.Math.round(($.app.pos.lat2posY($.app.markers[marker].lat)-yMin) / zp * zf) + $.app.markers[marker].offsetY - offsetY;
								if(x>-50 && x<$.app.renderer.canvas.width+50 && y>-50 && y<$.app.renderer.canvas.height+50){
									try {
										$.app.renderer.context.drawImage($.app.markers[marker].img, x, y);
									} catch (e) {
									}
								}
							} else {
								$.app.markers[marker].img = new Image();
								$.app.markers[marker].img.src = $.app.markers[marker].src;
								$.app.markers[marker].img.onload = function(){
									$.app.renderer.refresh();
								}
							}
						}
					}
				},
				{
					id: 'tracks',
					zindex: 1,
					update : function(){
						if($.app.tracks && $.app.tracks.length){
							return true;
						}
						return false;
					},
					visible : true,
					callback :
					function(id, zi, zf, zp, sz, xMin, xMax, yMin, yMax, tilesize, offsetX, offsetY){
						function lon2x(lon){
					        return Math.round(($.app.pos.lon2posX(lon)-xMin) / zp*zf)-offsetX;
					    }
	
						function lat2y(lat){
	                        return Math.round(($.app.pos.lat2posY(lat)-yMin) / zp*zf)-offsetY;
						}
						for(var t in $.app.tracks){
							var track = $.app.tracks[t];
							$.app.renderer.context.strokeStyle = track.strokeStyle;
							$.app.renderer.context.lineWidth   = track.lineWidth;
							$.app.renderer.context.beginPath();
							$.app.renderer.context.moveTo(lon2x(track.points[0][0]), lat2y(track.points[0][1]));
							for(var i=1; i<track.points.length; i++){
								$.app.renderer.context.lineTo(lon2x(track.points[i][0]), lat2y(track.points[i][1]));	
							}
							$.app.renderer.context.stroke();
							$.app.renderer.context.closePath();
						}
					}
				}
			],
            refresh: function () {
                var now = function(){
                    return (new $.Date()).getTime();
                }
                var refreshBeforeFPS = 1000/$.app.renderer.refreshFPS - 
                	(now() - $.app.renderer.refreshLastStart);
                if(refreshBeforeFPS > 0){
					/* too early - postpone refresh */
					setTimeout($.app.renderer.refresh, refreshBeforeFPS);
					return;
                }
				$.app.renderer.refreshLastStart = now();
                var refreshId = ++$.app.renderer.refreshCounter;
                var z = $.app.pos.z;
                var zf = $.app.useFractionalZoom?(1+z-parseInt(z)):1;
                var zi = parseInt(z);
                var zp = $.Math.pow(2, $.app.renderer.maxZ - zi);
                var w = $.app.renderer.canvas.width * zp;
                var h = $.app.renderer.canvas.height * zp;
                var sz = $.app.renderer.tilesize * zp;
                var tilesize = $.Math.ceil($.app.renderer.tilesize*zf);
                var xMin = Math.floor($.app.pos.x - w / 2);
                var yMin = Math.floor($.app.pos.y - h / 2);
                var xMax = Math.ceil($.app.pos.x + w / 2);
                var yMax = Math.ceil($.app.pos.y + h / 2);
				var offsetX = Math.round((zf-1)*(xMax-xMin)/zp/2);
				var offsetY = Math.round((zf-1)*(yMax-yMin)/zp/2);
				for (l in $.app.renderer.layers) {
					if($.app.renderer.layers[l].visible && $.app.renderer.layers[l].update){
						$.app.renderer.layers[l].callback(refreshId, zi, zf, zp, sz, xMin, xMax, yMin, yMax, tilesize, offsetX, offsetY);
					}
				}
				for (var i = 0; i < $.app.renderer.refreshListeners.length; i++) {
					$.app.renderer.refreshListeners[i]();
				}
                if(refreshId % 10 === 0){
                	$.app.renderer.garbage();
                }
            },
            refreshCounter : 0,
            refreshLastStart : 0,
            refreshFPS : 50,
            refreshListeners : {},
            /* garbage collector, purges tiles if more than 500 are loaded and tile is more than 100 refresh cycles old */
            garbage: function () {
            	if($.app.renderer.tilecount>200){
	                if ($.app.renderer.tiles) {
    	                var remove = [];
        	            for (var key in $.app.renderer.tiles) {
            	            if ($.app.renderer.tiles[key] && 
	            	            $.app.renderer.tiles[key].complete &&
								$.app.renderer.tiles[key].lastDrawnId < ($.app.renderer.refreshCounter - 100)) {
	                            remove.push(key);
    	                    }
        	            }
	                    for (var i = 0; i < remove.length; i++) {
    	                    delete $.app.renderer.tiles[remove[i]];
        	            }
	                    $.app.renderer.tilecount -= i;
    	            }
    	        }
            }
        },
        /* positioning, conversion between pixel + lon/lat */
        pos: {
            getLonLat: function () {
                return [$.app.pos.tile2lon($.app.pos.x / $.app.renderer.tilesize, $.app.renderer.maxZ), $.app.pos.tile2lat($.app.pos.y / $.app.renderer.tilesize, $.app.renderer.maxZ), $.app.pos.z];
            },
            lat2posY: function (lat) {
                return $.Math.pow(2, $.app.renderer.maxZ) * $.app.renderer.tilesize * (1 - $.Math.log($.Math.tan(lat * $.Math.PI / 180) + 1 / $.Math.cos(lat * $.Math.PI / 180)) / $.Math.PI) / 2;
            },
            lon2posX: function (lon) {
                return $.Math.pow(2, $.app.renderer.maxZ) * $.app.renderer.tilesize * (lon + 180) / 360;
            },
            tile2lon: function (x, z) {
            	if(typeof z === 'undefined'){
            		z = $.app.pos.z;
            	}
                return (x / $.Math.pow(2, z) * 360 - 180);
            },
            tile2lat: function (y, z) {
            	if(typeof z === 'undefined'){
            		z = $.app.pos.z;
            	}
                var n = $.Math.PI - 2 * $.Math.PI * y / $.Math.pow(2, z);
                return (180 / $.Math.PI * $.Math.atan(0.5 * ($.Math.exp(n) - $.Math.exp(-n))));
            }
        }
    };
    $.document.addEventListener('DOMContentLoaded', $.app.init, null);
}(  window, // global
    "map",  // id of div
    1,      // zoom level
    0,     // lon
    0      // lat
));
if (navigator.userAgent.match(/iphone/i)) {
	setTimeout(scrollTo, 0, 0, 0);
}