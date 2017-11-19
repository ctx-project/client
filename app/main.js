import makeVisual from '../app/visual.js'
import makeHub from '../app/hub.js'
import * as $ from '../lib/bu$.js'

var xs = xstream.default,
		run = Cycle.default;

setTimeout(() => run(main, {
	visual: makeVisual(document.body),
	hub: makeHub(),
	router: $.makeEcho('router'),
	tabs: $.makeEcho('tabs'),
}));

function main({visual, hub, router, tabs}) {
	var visual$ = $.recover(visual, 'visual'),
			hub$ = $.recover(hub, 'hub'),
			router$ = $.recover(router, 'router'),
			tabs$ = $.recover(tabs, 'tabs'),
 			
			join$ = $.join(visual$, hub$, router$, tabs$),

			reduce$ = $.reduce(join$, {}, rules);
			
	return {
		visual: $.pick(reduce$, 'visual', {$type: 'init'}),
		hub: $.pick(reduce$, 'hub', {$type: 'init', base: window.location.href, user: 'andrei'}),
		router: $.pick(reduce$, 'router', {$type: 'route', route: '*View.1'}),
		tabs: $.pick(reduce$, 'tabs'),
	}
}

var rules = {
	visual_search: (s, p) => [{$name: 'hub_hints', query: p.search}],
	hub_hints: (s, p) => [{$name: 'visual_hints', hints: p.hints.split('\n')}],
	
	router_route(s, p) { 
		s.topic = p.route;
		s.config = null;
		s.views = {};
		s.leads = {};
		
		return [
			{$name: 'hub_sub', id: 'topic', query: p.route},
			{$name: 'hub_get', id: 'topic', $recover: 'views'}
		];
	},
	hub_views(s, p) {
		CtxParse.text(p.text, ['tags', 'meta', 'query']).forEach(i => {
			s.views[i.id] = i.removed ? undefined : i;
		});
		
		return [{$name: 'visual_views', views: s.views}];
	},
	
	visual_sub: (s, p) => forward(p, 'hub'),

	visual_get: (s, p) => forward(p, 'hub', 'items'),
	hub_items: (s, p) => forward(p, 'visual'),
};

function forward(p, tag, recover, type) {
	if(tag) p.$tag = tag; 
	if(recover) p.$recover = recover;
	if(type) p.$type = type;
	return [p];
}
