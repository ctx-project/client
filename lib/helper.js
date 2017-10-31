window.l = function(o) {console.log.apply(null, arguments); return o;};
window.s = new Samsara.DOM.Surface({properties: {background: 'red'}});

export function clone(o) {
	return JSON.parse(JSON.stringify(o));
}

export function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this,
			argestures = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, argestures);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, argestures);
	};
}

export function hexToRgba(hex, alpha) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? 'rgba(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ',' + alpha + ')' : null;
}

export function random(max) {
	return Math.round(Math.random() * max);
}

export function enhanceEvent(e, throwSpeed = 2, tapDistance = 10) {
	var vx = e.velocity[0],
			vy = e.velocity[1],
			sx = Math.abs(vx),
			sy = Math.abs(vy),
			sm = Math.max(sx, sy),
			s = Math.sqrt(sx ** 2 + sy ** 2),
			c = e.cumulate,
			d = Math.sqrt(c[0] ** 2 + c[1] ** 2);
	
	e.speed = s;
	e.distance = d;
	e.thrown = s > throwSpeed;
	e.tapped = d < tapDistance;
	e.orientation = e.tapped ? 'tap' :
									sm == vy ? 'bottom' : 
									sm == -vy ? 'top' :
									sm == vx ? 'right' :
									'left';

	return e;
}

export function dispatchGesture(e, detail, gestures, inherit) {
	var gesture = e.tapped ? 'tap' : e.orientation,
			type = e.thrown ? 'throw' : 'drag',
			gesturetype = `${gesture}.${type}`,
			g;
	
	//did not use inheritance because is costly to modify prototype and also 
	//i need gesture to override gesturetype from parent
	while(gestures) {
		if(g = gestures[gesturetype] || gestures[gesture] || gestures.default) break;
		gestures = inherit ? inherit(gestures.inherit) : null;
	}
	
	if(g)	g(detail, e);
}

