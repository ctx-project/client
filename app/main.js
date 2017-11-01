import makeCompositor from '../app/compositor.js'
import makeConnection from '../app/connection.js'

var xs = xstream.default,
		run = Cycle.default;

run(main, {
	compositor: makeCompositor(document.body),
	connection: makeConnection(),
})

function main({compositor, connection}) {
	var comp$ = connection.map(resp => ({type: 'hints', hints: resp.response.split('\n')})).startWith({type: 'init'}),
			conn$ = compositor.map(query => ({type: 'hints', query})).startWith({type: 'init', base: window.location.href, user: 'andrei'});
	
	// connection.addListener({next: console.log});
	// compositor.addListener({next: console.log});
	
	return {
		compositor: comp$,
		connection: conn$,
	}
}



