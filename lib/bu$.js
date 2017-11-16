var xs = xstream.default;

export function recover($, $tag) {
	return $.map(p => {
		if(p.$recover) p.$type = p.$recover;
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
		var rule = rules[p.$name];
		if(!rule) l(`Rule ${p.$name} does not exist!`);
		
		var patterns = rule ? rule(state, p) : [];
		
		patterns.forEach(p => {
			if(p.$name) [p.$tag, p.$type] = p.$name.split('_');
			if(!p.$tag || !p.$type) l('Pattern malformed', p);
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