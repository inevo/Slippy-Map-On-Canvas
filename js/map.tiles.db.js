(function( window, undefined) {
	if(window.slippymap !== undefined){
		window.slippymap.extension.tiles = slippymap.extension.google || {};
		window.slippymap.extension.tiles.tilesCache = function(map) {
			var tilesCache = {
				url : function(x,y,z){
						return "../tile.php?src=touch-icon.png&x="+x+"&y="+y+"&z="+z+"&format=png";
				},
//				url : "http://a.tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png",
				blank : "images/blank.gif",
				mime_type : "image/png",
				providerID: 'mapnik',
				init : function(){
					if (window.openDatabase) {
						tilesCache.sqlite = window.openDatabase('slippy-map-on-canvas', '0.1', 'stores tiles', 20000);
						if (tilesCache.sqlite){		 
							tilesCache.sqlite.transaction(function(tx) {
		//						tx.executeSql("DROP TABLE tiles",[]);
								tx.executeSql("SELECT COUNT(*) FROM tiles", [], function(tx, result) {
								}, function(tx, error) {
									tx.executeSql("CREATE TABLE tiles (provider TEXT, x INT, y INT, z INT, timestamp REAL, data BLOB)");
									})
								})
						}
						if (!tilesCache.sqlite){
							console.log("Failed to open the database.");
						} else {
							console.log("using sqlite to store tiles.");	
							map.tileprovider = tilesCache.tileprovider;
						}
					}
				},
				update : function(img) {
					var now = function(){
						return (new Date()).getTime();
					}
					tilesCache.sqlite.transaction(function (tx) {
						tx.executeSql("INSERT INTO tiles (provider, x, y, z, timestamp, data) VALUES (?, ?, ?, ?, ?, ?)", [img.meta.provider, img.meta.x, img.meta.y, img.meta.z, now(), img.data], 
							function(result) { 
								delete img;
							}
						);
					});
				},
				getBase64Image : function (img,mimetype) {
					canvas = document.createElement("canvas");
					canvas.width = img.width;
					canvas.height = img.height;
					ctx = canvas.getContext("2d");
					ctx.drawImage(img, 0, 0);
					return canvas.toDataURL(mimetype,'quality=20');
				},
				tileprovider  : function(x,y,z, imageObject){
					tilesCache.sqlite.transaction(function(tx) {
						tx.executeSql("SELECT data FROM tiles WHERE provider = ? AND x = ? AND y = ? AND z = ?", [tilesCache.providerID, x, y, z], 
							function(tx, result) {
								if(!result.rows.length){
									var img = new Image;
									img.src = tilesCache.url(x,y,z);
									img.meta = { "x":x, "y":y, "z":z, "provider": tilesCache.providerID};
									img.onload = function(){
										img.data = tilesCache.getBase64Image(this, tilesCache.mime_type);
										tilesCache.update(img);
									}
								} else {	
									imageObject.src = result.rows.item(0).data;
									map.renderer.refresh(); 
								}
							}
						);
					});
					return tilesCache.blank;
				}
			}
			return tilesCache;
		}
	}
})(window);
