var xs = xstream.default;

export default function() {
var emitter, conn, 
		
		driver = pattern$ => {
			pattern$.addListener({next: p => {
				if(emitter) rules[p.$type](p);
			}});
			
			return xs.create({
				start: function (e) { emitter = e;},
				stop: function () {emitter = null;},
			}); 
		},
		
		rules = {
			init({base, user}) {
				conn = new CtxConnection(base, user);
			},
			
			async hints(pattern) {
				pattern.hints = await conn.hints(pattern.query);
				emitter.next(pattern);
			},
			
			async get(pattern) {
				pattern.text = await conn.get(pattern.query);
				emitter.next(pattern);
			},
			
			async put(pattern) {
				pattern.text = await conn.put(pattern.item);
				emitter.next(pattern);
			},
		};
	
	return driver;
}