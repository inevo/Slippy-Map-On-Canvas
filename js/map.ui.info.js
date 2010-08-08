document.addEventListener('DOMContentLoaded', function(){
	app = window.app || {};
	app.info = app.info || {
		show : function(){
			document.getElementById("info").style.display = "block";
		},
		hide : function(){
			document.getElementById("info").style.display = "none";
		}
	}
}, null);
