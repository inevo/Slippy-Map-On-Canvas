var UI;
var geonamesReq;
var geolocation_error;
var useProxy = true;

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
                window.app.init();
                document.getElementById("geo").removeAttribute("dispatched");
                document.getElementById("geo").removeAttribute("error");
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
                    geolocate();
                    break;
                case 'watchposition':
                    stack.push(map);
                    app.ui.geolocation.watch(false, geoerror, {
                        enableHighAccuracy: true
                    });
                    break;
                case 'mark':
                    stack.push(map);
                    var pos = app.pos.getLonLat();
                    var id = (new Date()).getTime();
                    app.markers[id] = {
                        src: "../../../images/marker.png",
                        lon: pos[0],
                        lat: pos[1],
                        offsetX: -11,
                        offsetY: -25,
                        alpha: 1
                    };
                    app.renderer.refresh();

                    break;
                case 'clear':
                    stack.push(map);
                    app.markers = {};
                    app.renderer.refresh();

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
                switch (id) {
                case "gmap":
                    app.tileprovider = function (x, y, z) {
                        return "http://mt1.google.com/vt/x=" + x + "&y=" + y + "&z=" + z;
                    }
                    break;
                case "gsat":
                    app.tileprovider = function (x, y, z) {
                        return "http://khm1.google.com/kh/v=66&x=" + x + "&y=" + y + "&z=" + z;
                    }
                    break;
                case "gtopo":
                    app.tileprovider = function (x, y, z) {
                        return "http://mt0.google.com/vt/lyrs=t&x=" + x + "&y=" + y + "&z=" + z;
                    }
                    break;
                case "osma":
                    app.tileprovider = function (x, y, z) {
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
                    app.tileprovider = function (x, y, z) {
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
                app.renderer.tiles = [];
                app.renderer.refresh();
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
                    console.log(found);
                    if (found.geonames.length > 0) {
                        var locations = [];
                        for (var g in found.geonames) {
                            locations.push({
                                title: found.geonames[g].name + ", " + found.geonames[g].countryCode,
                                id: [found.geonames[g].lat, found.geonames[g].lng, 10]
                            })
                        }
                        foundmenu = new joCard([
                        new joTitle("Found"), foundmenulist = new joMenu(locations), new joFooter([
                        new joDivider(), cancelfound = new joButton("Back")])]);
                        cancelfound.selectEvent.subscribe(back, this);

                        foundmenulist.selectEvent.subscribe(function (id) {
                            stack.push(map);
                            app.recenter(parseFloat(id[1]), parseFloat(id[0]), parseFloat(id[2]));
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

        function geoerror(error) {
            geoerror = new joCard([
            new joTitle("Geolocation Error"), new joGroup([
            new joHTML("<h3>Error</h3><p>" + error.message + "</p>"), ]), new joFooter([
            new joDivider(), cancelgeoerror = new joButton("Back")])]);
            cancelgeoerror.selectEvent.subscribe(home, this);
            stack.push(geoerror);
        }


        function geolocate() {
            app.ui.geolocation.location(false, geoerror, {
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

    app.init = function () {
        var viewportWidth = innerWidth,
            viewportHeight = innerHeight;
        for (var i = 0; i < app.preInitListeners.length; i++) {
            app.preInitListeners[i]();
        }
        app.renderer.canvas = document.getElementById('map');
        app.renderer.canvas.width = viewportWidth;
        app.renderer.canvas.height = viewportHeight;
        app.pos.x = app.pos.x || app.pos.lon2posX(0);
        app.pos.y = app.pos.y || app.pos.lat2posY(0);
        app.pos.z = app.pos.z || 1;

        app.renderer.context = app.renderer.canvas.getContext("2d");
        app.renderer.sortLayers();
        app.renderer.refresh();
        app.events.init();
        for (var i = 0; i < app.postInitListeners.length; i++) {
            app.postInitListeners[i]();
        }
    }
});