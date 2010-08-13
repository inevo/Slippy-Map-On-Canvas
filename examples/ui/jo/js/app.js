var UI; 
var useSearchProxy = false;

document.addEventListener('DOMContentLoaded', function(){

jo.load();

UI = (function() {
	var stack;
	var button;
	var backbutton;
	var map;
	var cssnode;
	var cancelbutton;
	var find;
	var menu;
	var menulist;
	var tilemenu;
	var tilelist;
	
	function init() {
		joLog("UI.init()");
		
		// silly, but you you can load style tags with a string
		// which may be moderately useful. the node is returned,
		// so in theory you could replace it or remove it.
		// a more practical case would be to use the loadCSS() method
		// to load in an additional stylesheet
		cssnode = joDOM.applyCSS("h3, p {margin:0 0 0.5em}jocard { background-color: #ccc; background-image: url(css/aluminum/brushedgrey.png); background-repeat: no-repeat; background-attachment: fixed; -webkit-background-origin: content-box; -webkit-background-size: 100%; background-size: 100.5%; -moz-background-size: 100%; } .htmlgroup { background: #fff; }");
		
		stack = new joStack();
		stack.setStyle("page");
		
		find = new joCard([
			new joTitle("Find Geo Name"),
			new joGroup([
				new joLabel("Find"),
				nameinput = new joInput("Berlin"),
			]),
			new joFooter([
				new joDivider(),
				buttonfind = new joButton("Show on map"),
				cancelfind = new joButton("Back")
			])
		]);
		find.activate = function() {
			joFocus.set(nameinput);
			
			// not too happy about this; may turn this into two separate
			// calls to ensure the low-level one always gets called
			joCard.prototype.activate.call(this);
		};

		map = new joCard([
			htmlgroup = new joHTML(document.getElementById('templateMap').innerHTML)
		]);
		
		map.activate = function() {
			window.app.init();
		}

		menu = new joCard([
			new joTitle("Menu"),
			menulist = new joMenu([
				{ title: "Switch Tile Source", id: "tilemenu" },
				{ title: "Find Name", id: "find" },
				{ title: "Credits", id: "credits" },
			]),
			new joFooter([
				new joDivider(),
				cancelmenu = new joButton("Back")
			])
		]);
		menu.activate = function() {
			// maybe this should be built into joMenu...
			menulist.deselect();
		};

		menulist.selectEvent.subscribe(function(id) {
			stack.push(eval(id));
		});

		tilemenu = new joCard([
			new joTitle("Tile Sources"),
			tilelist = new joMenu([
				{ title: "OpenStreepMap, Mapnik", id: "mapnik",},
				{ title: "OpenStreepMap, OSMA", id: "osma" },
				{ title: "Goolge, Satellite Images", id: "gsat" },
				{ title: "Goolge, Street Map", id: "gmap" },
				{ title: "Goolge, Topo", id: "gtopo" }
			]),
			new joFooter([
				new joDivider(),
				canceltile = new joButton("Back")
			])
		]);
		tilemenu.activate = function() {
			// maybe this should be built into joMenu...
			tilelist.deselect();
		};

		tilelist.selectEvent.subscribe(function(id) {
			switch(id) {
				case "gmap" :		app.tileprovider = function (x, y, z) {
										return "http://mt1.google.com/vt/x="+x+"&y="+y+"&z="+z;
									}
									break;
				case "gsat" :		app.tileprovider = function (x, y, z) {
										return "http://khm1.google.com/kh/v=66&x="+x+"&y="+y+"&z="+z;
									}
									break;
				case "gtopo" :		app.tileprovider = function (x, y, z) {
										return "http://mt0.google.com/vt/lyrs=t&x="+x+"&y="+y+"&z="+z;
									}
									break;
				case "osma" :		app.tileprovider = function (x, y, z) {
										var rand = function (n) {
											return Math.floor(Math.random() * n);
										};
										var sub = ["a", "b", "c"];
										var url = "http://" + sub[rand(3)] + ".tah.openstreetmap.org/Tiles/tile/" + z + "/" + x + "/" + y + ".png";
										return url;
									}
									break;
				default:
				case "mapnik" :		app.tileprovider = function (x, y, z) {
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
		}, this);

		
		credits = new joCard([
			new joTitle("More Info"),
			new joGroup([
				new joHTML("<h3>UI</h3><p><strong>Jo</strong> is a lightweight JavaScript framework designed for HTML5 apps.</p>"),
				new joDivider(),
				new joHTML("<h3>Map</h3><p>Slippy Map on Canvas.</p>"),
			]),
			new joFooter([
				new joDivider(),
				cancelcredits = new joButton("Back")
			])
		]);

		
		buttonfind.selectEvent.subscribe(click.bind(map));
		cancelfind.selectEvent.subscribe(back, this);
		cancelmenu.selectEvent.subscribe(back, this);
		canceltile.selectEvent.subscribe(back, this);
		cancelcredits.selectEvent.subscribe(back, this);
		
		joGesture.forwardEvent.subscribe(stack.forward, stack);
		joGesture.backEvent.subscribe(stack.pop, stack);
		
		document.body.appendChild(stack.container);
		stack.push(map);
	}
	
	
	function click() {
		var url = 'http://gazetteer.openstreetmap.org/namefinder/search.xml?find='
		if(useSearchProxy || document.location.protocol !== 'file:'){
			url = '../../../search_proxy.php?find=';
		}
		url += escape(nameinput.container.innerHTML)+"&max=1&any=1";
		req = new XMLHttpRequest();
		req.onreadystatechange = processSearch;
		req.open('GET', url, true);
		req.send();
		stack.push(map);
	}
	
	function processSearch() {
		if (req.readyState == 4 && req.status == 200)  {
			var xmldoc = req.responseXML;
			var found = xmldoc.getElementsByTagName("named").item(0);
			lat = parseFloat(found.getAttribute("lat"));
			lon = parseFloat(found.getAttribute("lon"));		
			zoom = parseInt(found.getAttribute("zoom"));
			console.log(lon, lat, zoom);
			app.recenter(lon, lat,zoom);
		}
		return false;
	}
	
	function back() {
		stack.pop();
	}
	
	// public stuff
	return {
		"init": init,
		"show": function(card) { stack.push(eval(card)); }
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




