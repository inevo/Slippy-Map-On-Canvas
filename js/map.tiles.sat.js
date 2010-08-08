document.addEventListener('DOMContentLoaded', function(){
	app = window.app || {};
	
	app.tileprovider  = function(x,y,z){
        return "http://khm1.google.com/kh/v=66&x="+x+"&y="+y+"&z="+z;
    };
}, null);