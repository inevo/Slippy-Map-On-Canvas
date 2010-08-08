document.addEventListener('DOMContentLoaded', function(){
	app = window.app || {};
	app.ui = app.ui || {};
	app.ui.info = app.info || {
		show : function(){
			document.getElementById("info").style.display = "block";
		},
		hide : function(){
			document.getElementById("info").style.display = "none";
		}
	}
}, null);
