export function parseRoute(location) {
	return {
		type: 'push',
		pathname: itemR.query
	}
}

export function getSubRoute(topicR, itemR) {
	return {
		type: 'push',
		pathname: itemR.query
	}
}