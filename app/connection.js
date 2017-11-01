var xs = xstream.default;

export default function() {
	var conn, listener, cmds = {};
		
	cmds.init = function({base, user}) {
		conn = new CtxConnection(base, user);
	};
	
	cmds.hints = async function(req) {
		if(!listener) return;
		req.response = await conn.hints(req.query);
		listener.next(req);
	};
	
	return cmd$ => {
		cmd$.addListener({next: cmd => cmds[cmd.type](cmd)});
		
		return xs.create({
			start: function (l) {
				listener = l;
			},
		
			stop: function () {
				listener = null;
			},
		}); 
	}
}