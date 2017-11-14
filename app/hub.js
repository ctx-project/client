var xs = xstream.default;

export default function() {
var emitter, conn, ctxs, 
		
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
				l('init');
				conn = new CtxConnection(base, user);
				ctxs = {};
			},
			
			async hints(pattern) {
				pattern.hints = await conn.hints(pattern.query);
				emitter.next(pattern);
			},
			
			sub({id, parentId, query}) {
				rules.drop(id);
				ctxs[id] = (parentId ? ctxs[parentId] : conn).sub(query);
			},
			
			rewrite({id, query}) {
				
			},
			
			drop({id}) {
				//? should remove recursively; now i reset all only when topic changes
				if(id.startsWith('~')) ctxs[id] = undefined;
				else ctxs = {};
			},
			
			async get(pattern) {
				pattern.text = await ctxs[pattern.id].get();
				emitter.next(pattern);
			},
			
			async put(pattern) {
				pattern.text = await ctxs[pattern.id].put(pattern.item);
				emitter.next(pattern);
			},
		};
	
	return driver;
}