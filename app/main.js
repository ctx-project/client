import makeVisual from '../app/visual.js'
import makeHub from '../app/hub.js'
import * as $ from '../lib/bu$.js'
import * as Logic from '../app/logic.js'

var xs = xstream.default,
		run = Cycle.default,
		makeHistoryDriver = CycleHistory.makeHistoryDriver;
l('main');
setTimeout(() => run(main, {
	visual: makeVisual(document.body),
	hub: makeHub(),
	router: makeHistoryDriver(),
	tabs: $.makeEcho('tabs'),
}));

function main({visual, hub, router, tabs}) {
	var visual$ = $.recover(visual, 'visual'),
			hub$ = $.recover(hub, 'hub'),
			router$ = $.recover(router, 'router', 'route').take(1),
			tabs$ = $.recover(tabs, 'tabs'),
 			
			join$ = $.join(visual$, hub$, router$, tabs$),

			reduce$ = $.reduce(join$, {}, rules);
			
	return {
		hub: $.pick(reduce$, 'hub', {$type: 'init', base: window.location.origin, user: 'andrei'}),
		visual: $.pick(reduce$, 'visual', {$type: 'init'}),
		router: $.pick(reduce$, 'router'),
		tabs: $.pick(reduce$, 'tabs'),
	}
}

var rules = {
	visual_search: (s, p) => [{$name: 'hub_hints', query: p.search}],
	hub_hints: (s, p) => [{$name: 'visual_hints', hints: p.hints.split('\n')}],
	
	router_route(s, p) { 
		s.topic = p.pathname.slice(1);
		s.config = null;
		s.views = {};
		s.leads = {};
		
		return [
			{$name: 'hub_sub', id: 'topic', query: s.topic},
			{$name: 'hub_get', id: 'topic', $recover: 'views'}
		];
	},
	hub_views(s, p) {
		CtxParse.text(p.text, ['tags', 'meta', 'query']).forEach(i => {
			s.views[i.id] = i.removed ? undefined : i;
		});
		
		return [{$name: 'visual_views', views: s.views}];
	},
	visual_navPanel: (s, p) => [Object.assign(Logic.getSubRoute(s.topic, p.record), {$tag: 'router'})],
	// visual_navTopic: (s, p) => [Object.assign(Logic.getRoute(s.topic, p.index), {$tag: 'router'})],
	
	visual_sub: (s, p) => [Object.assign(p, {$tag: 'hub'})],

	visual_get: (s, p) => [Object.assign(p, {$tag: 'hub', $recover: 'items'})],
	hub_items: (s, p) => [Object.assign(p, {$tag: 'visual'})],
};
