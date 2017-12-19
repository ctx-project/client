var xs = xstream.default;

export function recover($, $tag, $type) {
	return $.map(p => {
		p.$type = p.$recover || p.$type || $type || 'default';
		p.$tag = $tag;
		p.$name = `${p.$tag}_${p.$type}`;
		return p;
	});
}

// export function spread($, ...predicates) {
// 	return {branches: [], default: $};
// }

export function join(...$) {
	//?wait all _join=tag.count
	return xs.merge(...$);
}

export function reduce($, state, rules) {
	return $.map(p => { 
		var patterns;
		
		if(p.$fw) {
			p.$name = p.$fw;
			p.$fw = undefined;
			patterns = [p];
		} 
		else {
			var rule = rules[p.$name];
			if(!rule) l(`Rule ${p.$name} does not exist!`);
			
			p.$name = undefined;
			
			patterns = (rule ? rule(state, p) : null) || [];
		}
		
		patterns.forEach(p => {
			if(p.$retype) { p.$type = p.$retype; p.$retype = undefined; }
			if(p.$name) [p.$tag, p.$type] = p.$name.split('_');
			if(!p.$tag) l('Pattern malformed', p);
		});
		
		return xs.fromArray(patterns);
	}).flatten();
}

export function pick($, $tag, start) {
	$ = $.filter(p => p.$tag == $tag);	
	
	if(start) $ = $.startWith(start);
	
	return $;
}

export function makeEcho(tag, spy) {
var emitter, 
		
		driver = pattern$ => {
			pattern$.debug(v => l(tag, v)).addListener({next: p => { 
				if(emitter) emitter.next(p);
			}});
			
			return xs.create({
				start: function (e) { emitter = e; },
				stop: function () {emitter = null;},
			}); 
		};

	return driver;
}

export function debug(tag) {
	return {
		next: i => console.log(tag, i),
		error: err => console.error(tag, err),
		complete: () => console.log(tag, 'completed'),
	}	
}