var UI;
var canvas;
var geonamesReq;
var geolocation_error;
var useProxy = false;
var state = {lon:0, lat:0, z:0}
document.addEventListener('DOMContentLoaded', function () {

    jo.load();

    UI = (function () {
        var stack;
        var button, buttonfind, cancelfind, backbutton, map, cssnode, cancelbutton, find, findagain, foundmenu, menu, menulist, tilemenu, tilelist, geoerror, cancelgeoerror;

        function init() {
            joLog("UI.init()");
            cssnode = joDOM.applyCSS("h3, p {margin:0 0 0.5em}jocard { background-color: #ccc; background-image: url(css/aluminum/brushedgrey.png); background-repeat: no-repeat; background-attachment: fixed; -webkit-background-origin: content-box; -webkit-background-size: 100%; background-size: 100.5%; -moz-background-size: 100%; } .htmlgroup { background: #fff; }");

            stack = new joStack();
            stack.setStyle("page");


            map = new joCard([
            htmlgroup = new joHTML(document.getElementById('templateMap').innerHTML)]);

            map.activate = function () {
                canvas =  slippymap("map", true, state.z, state.lon, state.lat, {}).init();

                document.getElementById("geo").removeAttribute("dispatched");
                document.getElementById("geo").removeAttribute("error");
                
				document.querySelectorAll("#buttons .zoomin")[0].addEventListener('click', canvas.zoomIn);
				document.querySelectorAll("#buttons .zoomout")[0].addEventListener('click', canvas.zoomOut);
				document.querySelectorAll("#buttons .gps")[0].addEventListener('click', function(){
					geolocate();
				});
				document.querySelectorAll("#buttons .settings")[0].addEventListener('click', function(){
	            	state = canvas.coords();
					UI.show(menu);
				});
                
            }
            menu = new joCard([
            new joTitle("Menu"), menulist = new joMenu([{
                title: "Switch Tile Source",
                id: "tilemenu"
            },
            {
                title: "Locate Position",
                id: "geolocate"
            },
            {
                title: "Watch Position",
                id: "watchposition"
            },
            {
                title: "Find Name",
                id: "find"
            },
            {
                title: "Set Marker",
                id: "mark"
            },
            {
                title: "Clear Markers",
                id: "clear"
            },
            {
                title: "Credits",
                id: "credits"
            }, ]), new joFooter([
            new joDivider(), cancelmenu = new joButton("Back")])]);
            menu.activate = function () {
                menulist.deselect();
            };

            menulist.selectEvent.subscribe(function (id) {
                switch (id) {
                case 'geolocate':
                    stack.push(map);
                   	canvas.geolocation.location();
                    break;
                case 'watchposition':
                    stack.push(map);
                    canvas.geolocation.watch(false, geoerror, {
                        enableHighAccuracy: true
                    });
                    break;
                case 'mark':
                    stack.push(map);
					addmarker();
                    break;
                case 'clear':
                    stack.push(map);
                    canvas.setMarkers();
                    canvas.refresh();

                    break;
                default:
                    stack.push(eval(id));
                }
            });

            tilemenu = new joCard([
            new joTitle("Tile Sources"), tilelist = new joMenu([{
                title: "OpenStreepMap, Mapnik",
                id: "mapnik",
            },
            {
                title: "OpenStreepMap, OSMA",
                id: "osma"
            },
            {
                title: "Goolge, Satellite Images",
                id: "gsat"
            },
            {
                title: "Goolge, Street Map",
                id: "gmap"
            },
            {
                title: "Goolge, Topo",
                id: "gtopo"
            }]), new joFooter([
            new joDivider(), canceltile = new joButton("Back")])]);
            tilemenu.activate = function () {
                // maybe this should be built into joMenu...
                tilelist.deselect();
            };

            tilelist.selectEvent.subscribe(function (id) {
            	var tileprovider;
                switch (id) {
                case "gmap":
                    tileprovider = function (x, y, z) {
                        return "http://mt1.google.com/vt/x=" + x + "&y=" + y + "&z=" + z;
                    }
                    break;
                case "gsat":
                    tileprovider = function (x, y, z) {
                        return "http://khm1.google.com/kh/v=66&x=" + x + "&y=" + y + "&z=" + z;
                    }
                    break;
                case "gtopo":
                    tileprovider = function (x, y, z) {
                        return "http://mt0.google.com/vt/lyrs=t&x=" + x + "&y=" + y + "&z=" + z;
                    }
                    break;
                case "osma":
                    tileprovider = function (x, y, z) {
                        var rand = function (n) {
                            return Math.floor(Math.random() * n);
                        };
                        var sub = ["a", "b", "c"];
                        var url = "http://" + sub[rand(3)] + ".tah.openstreetmap.org/Tiles/tile/" + z + "/" + x + "/" + y + ".png";
                        return url;
                    }
                    break;
                default:
                case "mapnik":
                    tileprovider = function (x, y, z) {
                        var rand = function (n) {
                            return Math.floor(Math.random() * n);
                        };
                        var sub = ["a", "b", "c"];
                        var url = "http://" + sub[rand(3)] + ".tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png";
                        return url;
                    }
                    break;
                }
                stack.push(map);
                canvas.setTileProvider(tileprovider);
            }, this);



            find = new joCard([
            new joTitle("Find Geo Name"), new joGroup([
            new joLabel("Find"), nameinput = new joInput("Berlin"), ]), new joFooter([
            new joDivider(), buttonfind = new joButton("Find"), cancelfind = new joButton("Back")])]);

            find.activate = function () {
                joFocus.set(nameinput);
                joCard.prototype.activate.call(this);
            };

            findreq = function () {
                if (useProxy) {
                    var url = '../../../search_proxy.php?q=' + escape(nameinput.container.innerHTML) + '&maxRows=50'; // &fuzzy=0';
                } else {
                    var url = 'http://ws.geonames.org/searchJSON?q=' + escape(nameinput.container.innerHTML) + '&maxRows=50'; // &fuzzy=0';
                }
                geonamesReq = new XMLHttpRequest();
                geonamesReq.onreadystatechange = processreq;
                geonamesReq.open('GET', url, true);
                geonamesReq.send();
            }


            findagain = new joCard([
            new joTitle("Find Geo Name"), new joGroup([
            new joLabel("Find"), nameinputagain = new joInput("Berlin"), ]), new joHTML("<p>Nothing found</p>"), new joFooter([
            new joDivider(), buttonfindagain = new joButton("Find (fuzzy logic)"), cancelfindagain = new joButton("Back")])]);
            findagain.activate = function () {
                joFocus.set(nameinput);

                // not too happy about this; may turn this into two separate
                // calls to ensure the low-level one always gets called
                joCard.prototype.activate.call(this);
            };


            findagainreq = function () {
                if (useProxy) {
                    var url = '../../../search_proxy.php?q=' + escape(nameinputagain.container.innerHTML) + '&maxRows=50&fuzzy=1';
                } else {
                    var url = 'http://ws.geonames.org/searchJSON?q=' + escape(nameinputagain.container.innerHTML) + '&maxRows=50&fuzzy=1';

                }
                geonamesReq = new XMLHttpRequest();
                geonamesReq.onreadystatechange = processreq;
                geonamesReq.open('GET', url, true);
                geonamesReq.send();
            }

            processreq = function () {
                if (geonamesReq.readyState == 4 && geonamesReq.status == 200) {
                    found = JSON.parse(geonamesReq.responseText);
                    if (found.geonames.length > 0) {
                        var locations = [];
                        for (var g in found.geonames) {
                            locations.push({
                                title: found.geonames[g].name + ", " + found.geonames[g].countryCode,
                                id: [found.geonames[g].lat, found.geonames[g].lng, 13 ,found.geonames[g].name]
                            })
                        }
                        foundmenu = new joCard([
                        new joTitle("Found"), foundmenulist = new joMenu(locations), new joFooter([
                        new joDivider(), cancelfound = new joButton("Back")])]);
                        cancelfound.selectEvent.subscribe(back, this);

                        foundmenulist.selectEvent.subscribe(function (id) {
                            stack.push(map);
                            canvas.recenter(parseFloat(id[1]), parseFloat(id[0]), parseFloat(id[2]));
							addmarker(id[3]);
                        });
                        stack.push(foundmenu);
                    } else {
                        stack.push(findagain);
                    }
                }
                return false;
            }


            credits = new joCard([
            new joTitle("More Info"), new joGroup([
            new joHTML("<h3>UI</h3><p><strong>Jo</strong> is a lightweight JavaScript framework designed for HTML5 apps.</p>"), new joDivider(), new joHTML("<h3>Map</h3><p>Slippy Map on Canvas.</p>"), ]), new joFooter([
            new joDivider(), cancelcredits = new joButton("Back")])]);


            buttonfind.selectEvent.subscribe(findreq);
            buttonfindagain.selectEvent.subscribe(findagainreq);
            cancelfind.selectEvent.subscribe(back, this);
            cancelmenu.selectEvent.subscribe(back, this);
            canceltile.selectEvent.subscribe(back, this);
            cancelcredits.selectEvent.subscribe(back, this);

            joGesture.forwardEvent.subscribe(stack.forward, stack);
            joGesture.backEvent.subscribe(stack.pop, stack);

            document.body.appendChild(stack.container);
            stack.push(map);
        }
        
        function addmarker(id){
        	        var pos = canvas.coords();
                    if(!id) id = (new Date()).getTime();
                    canvas.setMarker(id, {
	                        src: "../../../images/marker.png",
    	                    lon: pos.lon,
        	                lat: pos.lat,
            	            offsetX: -11,
                	        offsetY: -25,
                    	    alpha: 1
                      	}
                    );
                    console.log(id, {
	                        src: "../../../images/marker.png",
    	                    lon: pos[0],
        	                lat: pos[1],
            	            offsetX: -11,
                	        offsetY: -25,
                    	    alpha: 1
                      	}
                    );
                    canvas.refresh();
        }

		 function geosuccess(coords) {
            canvas.geolocation.displayPosition(coords);
            addmarker();
        }


        function geoerror(error) {
            geoerror = new joCard([
            new joTitle("Geolocation Error"), new joGroup([
            new joHTML("<h3>Error</h3><p>" + error.message + "</p>"), ]), new joFooter([
            new joDivider(), cancelgeoerror = new joButton("Back")])]);
            cancelgeoerror.selectEvent.subscribe(home, this);
            stack.push(geoerror);
        }


        function geolocate() {
            canvas.geolocation.location(geosuccess, geoerror, {
                enableHighAccuracy: true
            });
            document.getElementById("geo").setAttribute("dispatched", true);
        }

        function back() {
            stack.pop();
        }

        function home() {
            stack.push(map);
        }

        // public stuff
        return {
            "init": init,
            "geolocate": geolocate,
            "show": function (card) {
                stack.push(eval(card));
            }
        }

    }());

    UI.init();

    /* overwrite ini */

    
});