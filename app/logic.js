export function parseRoute(location) {
	var parts = location.pathname.split('/');
	return {
		base: window.location.origin,
		user: parts[1],
		topic: CtxParse.item(parts.slice(2).join(' '))
	}
}

var routeSerializer = CtxCompose.getItemSerializer({id: false, separator: '/'});

export function getRoute(user, oldTopic, newTopic) {
	return {
		type: 'push',
		pathname: `/${user}/${routeSerializer(newTopic)}`
	}
}