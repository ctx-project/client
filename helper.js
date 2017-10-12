var l = function(o) {console.log.apply(null, arguments); return o;};
var s = new Samsara.DOM.Surface({properties: {background: 'red'}});

var Helper = {
	debounce: function(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	},
	
	hexToRgba: function(hex, alpha) {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? 'rgba(' + 
				 parseInt(result[1], 16) + ',' +
				 parseInt(result[2], 16) + ',' +
				 parseInt(result[3], 16) + ',' +
				 alpha + ')'
			: null;
	}
	
}	

//https://gist.github.com/mathiasbynens/5670917
Math.random = (function() {
	var seed = 0x2F6E2B1;
	return function() {
		// Robert Jenkins’ 32 bit integer hash function
		seed = ((seed + 0x7ED55D16) + (seed << 12))	& 0xFFFFFFFF;
		seed = ((seed ^ 0xC761C23C) ^ (seed >>> 19)) & 0xFFFFFFFF;
		seed = ((seed + 0x165667B1) + (seed << 5))	 & 0xFFFFFFFF;
		seed = ((seed + 0xD3A2646C) ^ (seed << 9))	 & 0xFFFFFFFF;
		seed = ((seed + 0xFD7046C5) + (seed << 3))	 & 0xFFFFFFFF;
		seed = ((seed ^ 0xB55A4F09) ^ (seed >>> 16)) & 0xFFFFFFFF;
		return (seed & 0xFFFFFFF) / 0x10000000;
	};
}());