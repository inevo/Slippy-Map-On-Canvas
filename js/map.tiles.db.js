document.addEventListener('DOMContentLoaded', function(){
	app = window.app || {};
	app.tiles = app.tiles || {};
	app.tiles.db = {
		blank : "images/blank.gif",
		mime_type : "image/jpeg",
		init : function(){
			if (window.openDatabase) {
				app.tiles.db.sqlite = window.openDatabase('slippy-map-on-canvas', '0.1', 'stores tiles', 20000);
				if (app.tiles.db.sqlite){		 
					app.tiles.db.sqlite.transaction(function(tx) {
//						tx.executeSql("DROP TABLE tiles",[]);
						tx.executeSql("SELECT COUNT(*) FROM tiles", [], function(tx, result) {
						}, function(tx, error) {
							tx.executeSql("CREATE TABLE tiles (provider TEXT, x INT, y INT, z INT, timestamp REAL, data BLOB)");
							})
						})
				}
				if (!app.tiles.db.sqlite){
					console.log("Failed to open the database.");
				} else {
					console.log("using sqlite to store tiles.");	
					app.tileprovider = app.tiles.db.tileprovider;
				}
			}
		},
		update : function(img) {
			var now = function(){
				return (new Date()).getTime();
			}
			app.tiles.db.sqlite.transaction(function (tx) {
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
			var url = "http://khm1.google.com/kh/v=66&x="+x+"&y="+y+"&z="+z;
			app.tiles.db.sqlite.transaction(function(tx) {
				tx.executeSql("SELECT data FROM tiles WHERE provider = ? AND x = ? AND y = ? AND z = ?", ["gsat", x, y, z], 
					function(tx, result) {
						if(!result.rows.length){
							var img = new Image;
							img.src = url;
							img.meta = { "x":x, "y":y, "z":z, "provider": "gsat"};
							img.onload = function(){
								img.data = app.tiles.db.getBase64Image(this, app.tiles.db.mime_type);
								app.tiles.db.update(img);
							}
						} else {	
							imageObject.src = result.rows.item(0).data;
							app.renderer.refresh(); 
						}
					}
				);
			});
			return app.tiles.db.blank;
		}
	}
	app.preInitListeners.push(app.tiles.db.init);
}, null);