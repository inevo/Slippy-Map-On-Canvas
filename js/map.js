/*  Slippy Map on Canvas - HTML5
 *
 *  Copyright 2010 dFacts Network
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *
 *  based on/ inspired by Tim Hutt, http://concentriclivers.com/slippymap.html
 *  added features like touch support, fractional zoom, markers ...
 */
"use strict";
(function (window) {
    if (typeof window.slippymap === 'undefined') {
        var slippymap = function (div, fullscreen, z, x, y, markers, tracks, tileprovider) {
            var $ = this ||  window;
            var map = {
                init: function () {
                    if ($.document.getElementById(div)) {
                        var viewportWidth = $.innerWidth,
                            viewportHeight = $.innerHeight;
                        map.pos.x = (map.pos && map.pos.x) || map.pos.lon2posX(x);
                        map.pos.y = (map.pos && map.pos.y) || map.pos.lat2posY(y);
                        map.pos.z = (map.pos && map.pos.z) || z;
                        map.renderer.canvas = $.document.getElementById(div);
                        if (fullscreen === true) {
                            map.renderer.canvas.width = viewportWidth;
                            map.renderer.canvas.height = viewportHeight;
                        }
                        map.renderer.context = map.renderer.canvas.getContext("2d");
                        map.renderer.sortLayers();
                        map.renderer.refresh();
                        map.events.init();
                    } else {
                        $.console.log("canvas not found");
                    }
                },
                div: div,
                markers: markers || {},
                tracks: tracks ||   {},
                tileprovider: tileprovider ||
                function (x, y, z) {
                    var rand = function (n) {
                        return $.Math.floor($.Math.random() * n);
                    };
                    var sub = ["a", "b", "c"];
                    var url = "http://" + sub[rand(3)] + ".tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png";
                    return url;
                },
                useFractionalZoom: true,
                zoomIn: function (step, round) {
					if(!map.useFractionalZoom){
						step = Math.round(step);
						if(step<1) {
							step = 1;
						}
					}
                    if (map.pos.z < map.renderer.maxZ) {
                        map.pos.z += step || 1;
                        if (round !== false) {
                            map.pos.z = $.Math.round(map.pos.z);
                        }
                        if (map.pos.z > map.renderer.maxZ) {
                            map.pos.z = map.renderer.maxZ;
                        }
                        map.renderer.refresh();
                        map.zoomed();
                    }
                },
                zoomOut: function (step, round) {
					if(!map.useFractionalZoom){
						step = Math.round(step);
						if(step<1) {
							step = 1;
						}
					}
                    if (map.pos.z > 0) {
                        map.pos.z -= step || 1;
                        if (round !== false) {
                            map.pos.z = $.Math.round(map.pos.z);
                        }
                        if (map.pos.z < 0) {
                            map.pos.z = 0;
                        }
                        map.renderer.refresh();
                        map.zoomed();
                    }
                },
                recenter: function (lon, lat, zoom) {
                    map.pos.x = map.pos.lon2posX(lon);
                    map.pos.y = map.pos.lat2posY(lat);
                    if (zoom >= 0) {
                        map.pos.z = zoom;
                    }
                    map.renderer.refresh();
                },
                /* keep track of zoom + pans */
                zoomed: function () {
                    for (var i = 0; i < map.zoomedListeners.length; i++) {
                        map.zoomedListeners[i]();
                    }
                },
                zoomedListeners: [],
                moved: function () {
                    for (var i = 0; i < map.movedListeners.length; i++) {
                        map.movedListeners[i]();
                    }
                },
                movedListeners: [],
                resized: function () {
                    var viewportWidth = $.innerWidth,
                        viewportHeight = $.innerHeight;
                    if (fullscreen === true) {
                        map.renderer.canvas.width = viewportWidth;
                        map.renderer.canvas.height = viewportHeight;
                    }
                    map.renderer.refresh();
                },
                /* events */
                events: {
                    lastMouseX: 0,
                    lastMouseY: 0,
                    dragging: false,
                    lastTouchEvent: {},
                    lastTouchEventBeforeLast: {},
                    zoomIn: function (event, step, round) {
                        map.zoomIn(step, round);
                    },
                    zoomOut: function (event, step, round) {
                        map.zoomOut(step, round);
                    },
                    mouseDown: function (event) {
                        if (!event) {
                            event = $.event;
                        }
                        var x = event.clientX - map.renderer.canvas.offsetLeft;
                        var y = event.clientY - map.renderer.canvas.offsetTop;
                        if (event.button === 0) {
                            map.events.dragging = true;
                        }
                        map.events.lastMouseX = x;
                        map.events.lastMouseY = y;
                    },
                    mouseMove: function (event) {
                        if (!event) {
                            event = $.event;
                        }
                        var x = event.clientX - map.renderer.canvas.offsetLeft;
                        var y = event.clientY - map.renderer.canvas.offsetTop;
                        if (map.events.dragging === true) {
                            var dX = x - map.events.lastMouseX;
                            var dY = y - map.events.lastMouseY;
                            map.pos.x -= dX * $.Math.pow(2, map.renderer.maxZ - map.pos.z);
                            map.pos.y -= dY * $.Math.pow(2, map.renderer.maxZ - map.pos.z);
                            map.renderer.refresh();
                            map.moved();
                        }
                        map.events.lastMouseX = x;
                        map.events.lastMouseY = y;
                    },
                    mouseUp: function () {
                        map.events.dragging = false;
                    },
                    mouseOut: function () {
                        map.events.dragging = false;
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
                            map.zoomIn(delta / 100, false);
                            map.zoomed();
                        } else if (delta < 0) {
                            map.zoomOut(-delta / 100, false);
                            map.zoomed();
                        }
                    },
                    doubleClick: function (event) {
                        if (!event) {
                            event = $.event;
                        }
                        var x = event.clientX - map.renderer.canvas.offsetLeft;
                        var y = event.clientY - map.renderer.canvas.offsetTop;
                        var dX = x - map.renderer.canvas.width / 2;
                        var dY = y - map.renderer.canvas.height / 2;
                        map.pos.x += dX * $.Math.pow(2, map.renderer.maxZ - map.pos.z);
                        map.pos.y += dY * $.Math.pow(2, map.renderer.maxZ - map.pos.z);
                        map.events.lastMouseX = x;
                        map.events.lastMouseY = y;
                        map.zoomIn(1, true);
                    },
                    /* maps touch events to mouse events */
                    touchHandler: function (event) {
                        var now = function () {
                            return (new $.Date()).getTime();
                        };
                        var touches;
                        if (event.type !== 'touchend') {
                            touches = event.targetTouches;
                        } else {
                            touches = event.changedTouches;
                        }
                        var type, first = touches[0];
                        if (touches.length === 1) {
                            switch (event.type) {
                            case 'touchstart':
                                type = 'mousedown';
                                break;
                            case 'touchmove':
                                type = 'mousemove';
                                break;
                            case 'touchcancel':
                            case 'touchend':
                                type = 'mouseup';
                                break;
                            default:
                                return;
                            }
                            if (map.events.lastTouchEventBeforeLast && event.type == 'touchend' && map.events.lastTouchEvent.type === 'touchstart' && map.events.lastTouchEventBeforeLast.type == 'touchend' && event.x == map.events.lastTouchEventBeforeLast.x && event.y == map.events.lastTouchEventBeforeLast.y && now() - map.events.lastTouchEventBeforeLast.timeStamp < 500) {
                                map.events.lastTouchEventBeforeLast = false;
                                map.events.lastTouchEvent.timeStamp = now();
                                type = 'dblclick';
                            }
                            var simulatedEvent = $.document.createEvent('MouseEvent');
                            simulatedEvent.initMouseEvent(type, true, true, $, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/ , null);
                            first.target.dispatchEvent(simulatedEvent);
                            map.events.lastTouchEventBeforeLast = map.events.lastTouchEvent;
                            map.events.lastTouchEvent = event;
                        }
                        if (event.preventDefault) {
                            event.preventDefault();
                        }
                    },
                    /* minimal pinch support */
                    gestureHandler: function (event) {
                        if (event.scale) {
                            if (event.scale > 1) {
                                map.zoomIn((event.scale - 1) / 10, false);
                                return true;
                            }
                            if (event.scale < 1) {
                                map.zoomOut(event.scale / 10, false);
                                return true;
                            }
                        }
                        if (event.preventDefault) {
                            event.preventDefault();
                        }
                    },
                    /* attaches events to map + window */
                    init: function () {
                        $.addEventListener('resize', map.resized, false);
                        map.renderer.canvas.addEventListener('DOMMouseScroll', map.events.mouseWheel, false);
                        map.renderer.canvas.addEventListener('mousewheel', map.events.mouseWheel, false);
                        map.renderer.canvas.addEventListener('mousedown', map.events.mouseDown, false);
                        map.renderer.canvas.addEventListener('mousemove', map.events.mouseMove, false);
                        map.renderer.canvas.addEventListener('mouseup', map.events.mouseUp, false);
                        map.renderer.canvas.addEventListener('mouseout', map.events.mouseOut, false);
                        map.renderer.canvas.addEventListener('dblclick', map.events.doubleClick, false);
                        map.renderer.canvas.addEventListener('touchstart', map.events.touchHandler, false);
                        map.renderer.canvas.addEventListener('touchmove', map.events.touchHandler, false);
                        map.renderer.canvas.addEventListener('touchend', map.events.touchHandler, false);
                        map.renderer.canvas.addEventListener('touchcancel', map.events.touchHandler, false);
                        map.renderer.canvas.addEventListener('gesturestart', map.events.gestureHandler, false);
                        map.renderer.canvas.addEventListener('gesturechange', map.events.gestureHandler, false);
                        map.renderer.canvas.addEventListener('gestureend', map.events.gestureHandler, false);
                    }
                },
                /* renderer */
                renderer: {
                    canvas: {},
                    context: {},
                    maxZ: 18,
                    lastRenderTime: 0,
                    tiles: [],
                    tilecount: 0,
                    tilesize: 256,
                    addLayer: function (layer) {
                        map.renderer.layers.push(layer);
                        map.renderer.sortLayers();
                    },
                    sortLayers: function () {
                        function sortZIndex(a, b) {
                            var x = a.zindex;
                            var y = b.zindex;
                            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                        }
                        map.renderer.layers.sort(sortZIndex);
                    },
                    layers: [{ /* repaint canvas, load missing images */
                        id: 'tiles',
                        zindex: 0,
                        update: true,
                        visible: true,
                        alpha: 1,
                        callback: function (id, zi, zf, zp, sz, xMin, xMax, yMin, yMax, tilesize, offsetX, offsetY, alpha) {
                            map.renderer.context.globalAlpha = alpha;
                            map.renderer.context.fillStyle = "#000000";
                            map.renderer.context.fillRect(0, 0, map.renderer.canvas.width, map.renderer.canvas.height);
                        }
                    },
                    { /* repaint canvas, load missing images */
                        id: 'tiles',
                        zindex: 1,
                        update: true,
                        visible: true,
                        alpha: 1,
                        callback: function (id, zi, zf, zp, sz, xMin, xMax, yMin, yMax, tilesize, offsetX, offsetY, alpha) {
                            var tileprovider, tileLayers;
                            var maxTileNumber = $.Math.pow(2, zi) - 1;
                            var tileDone = [];
                            var preload = 0;
                            var encodeIndex = function (x, y, z) {
                                return x + "," + y + "," + z;
                            };
                            if (typeof map.tileprovider === 'function') {
                                tileLayers = {
                                    base: {
                                        url: map.tileprovider
                                    }
                                };
                            } else {
                                tileLayers = map.tileprovider;
                            }
                            for (var t in tileLayers) {
                                if (tileLayers.hasOwnProperty(t)) {
                                    tileprovider = tileLayers[t].url;
                                    map.renderer.context.globalAlpha = tileLayers[t].alpha ||  alpha;
                                    map.renderer.tiles[t] = map.renderer.tiles[t] ||   {};
                                    tileDone = [];
                                    for (var x = $.Math.floor(xMin / sz) - preload; x < $.Math.ceil(xMax / sz) + preload; ++x) {
                                        tileDone[x] = [];
                                        for (var y = $.Math.floor(yMin / sz) - preload; y < $.Math.ceil(yMax / sz) + preload; ++y) {
                                            var xoff = $.Math.round((x * sz - xMin) / zp * zf) - offsetX;
                                            var yoff = $.Math.round((y * sz - yMin) / zp * zf) - offsetY;
                                            var tileKey = encodeIndex(x, y, zi);
                                            tileDone[tileKey] = false;
                                            if (x > maxTileNumber || y > maxTileNumber || x < 0 || y < 0) {
                                                map.renderer.context.fillStyle = "#dddddd";
                                                map.renderer.context.fillRect(xoff, yoff, tilesize, tilesize);
                                                tileDone[tileKey] = true;
                                            } else {
                                                if (map.renderer.tiles[t][tileKey] && map.renderer.tiles[t][tileKey].complete) {
                                                    try {
                                                        map.renderer.context.drawImage(map.renderer.tiles[t][tileKey], xoff, yoff, tilesize, tilesize);
                                                        map.renderer.tiles[t][tileKey].lastDrawnId = id;
                                                    } catch (e) {
                                                        map.renderer.context.fillStyle = "#dddddd";
                                                        map.renderer.context.fillRect(xoff, yoff, tilesize, tilesize);
                                                    }
                                                    tileDone[tileKey] = true;
                                                } else {
                                                    var tileAboveX = $.Math.floor(x / 2);
                                                    var tileAboveY = $.Math.floor(y / 2);
                                                    var tileAboveZ = zi - 1;
                                                    var tilePartOffsetX = $.Math.ceil(x - tileAboveX * 2);
                                                    var tilePartOffsetY = $.Math.ceil(y - tileAboveY * 2);
                                                    var tileKeyAbove = encodeIndex(tileAboveX, tileAboveY, tileAboveZ);
                                                    if (preload && !map.renderer.tiles[t][tileKeyAbove]) {
                                                        map.renderer.tiles[t][tileKeyAbove] = new $.Image();
                                                        map.renderer.tiles[t][tileKeyAbove].src = tileprovider(tileAboveX, tileAboveY, tileAboveZ, map.renderer.tiles[t][tileKeyAbove]);
                                                        map.renderer.tiles[t][tileKeyAbove].onload = map.renderer.refresh;
                                                        map.renderer.tiles[t][tileKeyAbove].onerror = null;
                                                    }
                                                    if (!tileDone[tileKey] && map.renderer.tiles[t][tileKeyAbove] && map.renderer.tiles[t][tileKeyAbove].lastDrawnId) {
                                                        var tileOffsetX = xoff - tilePartOffsetX * tilesize;
                                                        var tileOffsetY = yoff - tilePartOffsetY * tilesize;
                                                        try {
                                                            map.renderer.context.drawImage(
                                                            map.renderer.tiles[t][tileKeyAbove], tilePartOffsetX * map.renderer.tilesize / 2, tilePartOffsetY * map.renderer.tilesize / 2, map.renderer.tilesize / 2, map.renderer.tilesize / 2, tileOffsetX + tilesize * tilePartOffsetX, tileOffsetY + tilesize * tilePartOffsetY, tilesize, tilesize);
                                                            map.renderer.tiles[t][tileKeyAbove].lastDrawnId = id;
                                                        } catch (e_above) {
                                                            map.renderer.context.fillStyle = "#dddddd";
                                                            map.renderer.context.fillRect(tileOffsetX, tileOffsetY, $.Math.ceil(2 * tilesize), $.Math.ceil(2 * tilesize));
                                                        }
                                                        tileDone[tileKey] = true;
                                                    } else {
                                                        if (!tileDone[tileKey]) {
                                                            map.renderer.context.fillStyle = "#dddddd";
                                                            map.renderer.context.fillRect(xoff, yoff, tilesize, tilesize);
                                                            tileDone[tileKey] = true;
                                                        }
                                                    }
                                                    if (!map.renderer.tiles[t][tileKey]) {
                                                        map.renderer.tiles[t][tileKey] = new $.Image();
                                                        map.renderer.tiles[t][tileKey].lastDrawnId = 0;
                                                        map.renderer.tilecount++;
                                                        map.renderer.tiles[t][tileKey].src = tileprovider(x, y, zi, map.renderer.tiles[t][tileKey]);
                                                        map.renderer.tiles[t][tileKey].onload = map.renderer.refresh;
                                                        map.renderer.tiles[t][tileKey].onerror = null;
                                                    }
                                                }
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
                        update: function () {
                            if (map.markers && map.markers.length) {
                                return true;
                            }
                            return false;
                        },
                        visible: true,
                        alpha: 1,
                        callback: function (id, zi, zf, zp, sz, xMin, xMax, yMin, yMax, tilesize, offsetX, offsetY, alpha) {
                            for (var marker in map.markers) {
                                if (map.markers[marker].img && map.markers[marker].img.complete) {
                                    x = $.Math.round((map.pos.lon2posX(map.markers[marker].lon) - xMin) / zp * zf) + map.markers[marker].offsetX - offsetX;
                                    y = $.Math.round((map.pos.lat2posY(map.markers[marker].lat) - yMin) / zp * zf) + map.markers[marker].offsetY - offsetY;
                                    if (x > -50 && x < map.renderer.canvas.width + 50 && y > -50 && y < map.renderer.canvas.height + 50) {
                                        try {
                                            map.renderer.context.globalAlpha = map.markers[marker].alpha ||  alpha;
                                            map.renderer.context.drawImage(map.markers[marker].img, x, y);
                                        } catch (e) {}
                                    }
                                } else {
                                    map.markers[marker].img = new $.Image();
                                    map.markers[marker].img.src = map.markers[marker].src;
                                    map.markers[marker].img.onload = map.renderer.refresh;
                                }
                            }
                        }
                    },
                    {
                        id: 'tracks',
                        zindex: 1,
                        update: function () {
                            if (map.tracks && map.tracks.length) {
                                return true;
                            }
                            return false;
                        },
                        visible: true,
                        alpha: 0.8,
                        callback: function (id, zi, zf, zp, sz, xMin, xMax, yMin, yMax, tilesize, offsetX, offsetY, alpha) {
                            map.renderer.context.globalAlpha = alpha;
                            function lon2x(lon) {
                                return Math.round((map.pos.lon2posX(lon) - xMin) / zp * zf) - offsetX;
                            }
                            function lat2y(lat) {
                                return Math.round((map.pos.lat2posY(lat) - yMin) / zp * zf) - offsetY;
                            }
                            for (var t in map.tracks) {
                                if (map.tracks.hasOwnProperty(t)) {
                                    var track = map.tracks[t];
                                    map.renderer.context.globalAlpha = track.alpha ||  alpha;
                                    map.renderer.context.strokeStyle = track.strokeStyle;
                                    map.renderer.context.lineWidth = track.lineWidth;
                                    map.renderer.context.beginPath();
                                    map.renderer.context.moveTo(lon2x(track.points[0][0]), lat2y(track.points[0][1]));
                                    for (var i = 1; i < track.points.length; i++) {
                                        map.renderer.context.lineTo(lon2x(track.points[i][0]), lat2y(track.points[i][1]));
                                    }
                                    map.renderer.context.stroke();
                                    map.renderer.context.closePath();
                                }
                            }
                        }
                    }],
                    refresh: function () {
                        var now = function () {
                            return (new $.Date()).getTime();
                        };
                        var refreshBeforeFPS = 1000 / map.renderer.refreshFPS - (now() - map.renderer.refreshLastStart);
                        if (refreshBeforeFPS > 0) { /* too early - postpone refresh */
                            $.setTimeout(map.renderer.refresh, refreshBeforeFPS);
                            return;
                        }
                        map.renderer.refreshLastStart = now();
                        var refreshId = ++map.renderer.refreshCounter;
                        var z = map.pos.z;
                        var zi = parseInt(z, 10);
                        var zf = map.useFractionalZoom ? (1 + z - zi) : 1;
                        var zp = $.Math.pow(2, map.renderer.maxZ - zi);
                        var w = map.renderer.canvas.width * zp;
                        var h = map.renderer.canvas.height * zp;
                        var sz = map.renderer.tilesize * zp;
                        var tilesize = $.Math.ceil(map.renderer.tilesize * zf);
                        var xMin = Math.floor(map.pos.x - w / 2);
                        var yMin = Math.floor(map.pos.y - h / 2);
                        var xMax = Math.ceil(map.pos.x + w / 2);
                        var yMax = Math.ceil(map.pos.y + h / 2);
                        var offsetX = Math.round((zf - 1) * (xMax - xMin) / zp / 2);
                        var offsetY = Math.round((zf - 1) * (yMax - yMin) / zp / 2);
                        for (var l in map.renderer.layers) {
                            if (map.renderer.layers.hasOwnProperty(l)) {
                                if (map.renderer.layers[l].visible && map.renderer.layers[l].update) {
                                    map.renderer.layers[l].callback(refreshId, zi, zf, zp, sz, xMin, xMax, yMin, yMax, tilesize, offsetX, offsetY, map.renderer.layers[l].alpha);
                                }
                            }
                        }
                        for (var i = 0; i < map.renderer.refreshListeners.length; i++) {
                            map.renderer.refreshListeners[i]();
                        }
                        if (refreshId % 10 === 0) {
                            map.renderer.garbage();
                        }
                    },
                    refreshCounter: 0,
                    refreshLastStart: 0,
                    refreshFPS: 50,
                    refreshListeners: {},
                    /* garbage collector, purges tiles if more than 500 are loaded and tile is more than 100 refresh cycles old */
                    garbage: function () {
                        if (map.renderer.tilecount > 200) {
                            if (map.renderer.tiles) {
                                var remove = [];
                                for (var key in map.renderer.tiles) {
                                    if (map.renderer.tiles[key] && map.renderer.tiles[key].complete && map.renderer.tiles[key].lastDrawnId < (map.renderer.refreshCounter - 100)) {
                                        remove.push(key);
                                    }
                                }
                                for (var i = 0; i < remove.length; i++) {
                                    delete map.renderer.tiles[remove[i]];
                                }
                                map.renderer.tilecount -= i;
                            }
                        }
                    }
                },
                /* positioning, conversion between pixel + lon/lat */
                pos: {
                    getLonLat: function () {
                        return {
                            lon: map.pos.tile2lon(map.pos.x / map.renderer.tilesize, map.renderer.maxZ),
                            lat: map.pos.tile2lat(map.pos.y / map.renderer.tilesize, map.renderer.maxZ),
                            z: map.pos.z
                        };
                    },
                    lat2posY: function (lat) {
                        return $.Math.pow(2, map.renderer.maxZ) * map.renderer.tilesize * (1 - $.Math.log($.Math.tan(lat * $.Math.PI / 180) + 1 / $.Math.cos(lat * $.Math.PI / 180)) / $.Math.PI) / 2;
                    },
                    lon2posX: function (lon) {
                        return $.Math.pow(2, map.renderer.maxZ) * map.renderer.tilesize * (lon + 180) / 360;
                    },
                    tile2lon: function (x, z) {
                        if (typeof z === 'undefined') {
                            z = map.pos.z;
                        }
                        return (x / $.Math.pow(2, z) * 360 - 180);
                    },
                    tile2lat: function (y, z) {
                        if (typeof z === 'undefined') {
                            z = map.pos.z;
                        }
                        var n = $.Math.PI - 2 * $.Math.PI * y / $.Math.pow(2, z);
                        return (180 / $.Math.PI * $.Math.atan(0.5 * ($.Math.exp(n) - $.Math.exp(-n))));
                    }
                }
            };
            return { /* public functions */
                init: function (config) { /* init extensions first */
                    for (var e in slippymap.extension) {
                        if (typeof slippymap.extension[e] === 'function') {
                            this[e] = slippymap.extension[e](map);
                            if (typeof this[e].init === 'function') {
                                this[e].init();
                            }
                        } else {
                            this[e] = {};
                            for (var sub in slippymap.extension[e]) {
                                if (slippymap.extension[e].hasOwnProperty(sub)) {
                                    this[e][sub] = slippymap.extension[e][sub](map);
                                    if (typeof this[e][sub].init === 'function') {
                                        this[e][sub].init();
                                    }
                                }
                            }
                        }
                    }
                    if (typeof config === 'function') {
                        config(this);
                    }
                    map.init();
                    return this;
                },
                center: function (coords) {
                    if (typeof coords !== 'object') {
                        return {
                            x: map.pos.x,
                            y: map.pos.y,
                            z: map.pos.z
                        };
                    } else {
                        map.pos.x = parseFloat(coords.x);
                        map.pos.y = parseFloat(coords.y);
                        map.pos.z = parseFloat(coords.z);
                        map.renderer.refresh();
                    }
                    return this;
                },
                maxZ: function (z) {
                    if (typeof z !== 'number') {
                        return map.renderer.maxZ;
                    } else {
                        map.renderer.maxZ = z;
                    }
                    return this;
                },
                coords: function (coords) {
                    if (typeof coords !== 'object') {
                        return map.pos.getLonLat();
                    } else {
                        map.pos.recenter(parseFloat(coords.lon), parseFloat(coords.lat), parseFloat(coords.zoom));
                        map.renderer.refresh();
                    }
                    return this;
                },
                refresh: function () {
                    map.renderer.refresh();
                },
                setWidth: function (width) {
                    map.renderer.canvas.width = width;
                },
                setHeight: function (height) {
                    map.renderer.canvas.height = height;
                },
                addMovedListeners: function (listener) {
                    map.movedListeners.push(listener);
                },
                addZoomedListeners: function (listener) {
                    map.zoomedListeners.push(listener);
                },
                zoomIn: function (event, step, round) {
                    map.events.zoomIn(event, step, round);
                },
                zoomOut: function (event, step, round) {
                    map.events.zoomOut(event, step, round);
                },
                getTileCache: function () {
                	if(map.renderer.tiles.length == 1) {
						return map.renderer.tiles[0];
					} else {
						return map.renderer.tiles;
					}
               	},
                setTileProvider: function (url, cache) {
                    map.tileprovider = url;
                    map.renderer.tiles = cache || [];
                    map.renderer.refresh();
                },
                setMarkers: function (markers) {
                    map.markers = markers;
                    map.renderer.refresh();
                },
                setMarker: function (id, marker) {
                    map.markers[id] = marker;
                    map.renderer.refresh();
                },
                setTracks: function (tracks) {
                    map.tracks = tracks;
                    map.renderer.refresh();
                },
                tileSize: function (size) {
                    if (typeof size !== 'number') {
                        return map.renderer.tilesize;
                    } else {
                        map.renderer.tilesize = size;
                    }
                },
                fractionalZoom: function (state) {
                    if (state !== true && state !== false) {
                        return map.useFractionalZoom;
                    } else {
                        map.useFractionalZoom = state;
                    }
                }
            };
        };
        slippymap.extension = {};
        window.slippymap = slippymap;
    }
})(window);