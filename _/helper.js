
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

