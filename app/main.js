import makeVisual from '../app/visual.js'
import makeHub from '../app/hub.js'
import * as $ from '../lib/bu$.js'
import * as Logic from '../app/logic.js'

var xs = xstream.default,
		run = Cycle.default,
		makeHistoryDriver = CycleHistory.makeHistoryDriver;

setTimeout(() => run(main, {
	visual: makeVisual(document.body),
	hub: makeHub(),
	router: makeHistoryDriver(),
	tabs: $.makeEcho('tabs'),
}));

function main({visual, hub, router, tabs}) {
	var visual$ = $.recover(visual, 'visual'),
			hub$ = $.recover(hub, 'hub'),
			router$ = $.recover(router, 'router', 'route'),
			tabs$ = $.recover(tabs, 'tabs'),
 			
			join$ = $.join(visual$, hub$, router$, tabs$),

			reduce$ = $.reduce(join$, {}, rules);
			
	return {
		hub: $.pick(reduce$, 'hub'),
		visual: $.pick(reduce$, 'visual', {$type: 'init'}),
		router: $.pick(reduce$, 'router'),
		tabs: $.pick(reduce$, 'tabs'),
	}
}

var rules = {
	visual_search: (s, p) => [{$name: 'hub_hints', query: p.search}],
	hub_hints: (s, p) => [{$name: 'visual_hints', hints: p.hints.split('\n')}],
	
	router_route(s, p) { 
		var {base, user, topic} = Logic.parseRoute(p);
		s.user = user;
		s.topic = topic;
		s.config = null;
		s.views = {};
		s.leads = {};
		
		return [
			{$name: 'hub_init', base, user},
			{$name: 'hub_get', query: `*view ${s.topic.item}`, flags: {exact: true}, $recover: 'views'}
		];
	},
	hub_views(s, p) {
		CtxParse.text(p.text, ['tags', 'meta', 'words', 'query']).forEach(i => {
			s.views[i.id] = i.removed ? undefined : i;
		});
		
		return [{$name: 'visual_views', views: s.views, topic: s.topic}];
	},
	visual_navPanel: (s, p) => [Object.assign(Logic.getRoute(s.user, s.topic, CtxCompose.combineTopicView(s.topic, p.record)), {$tag: 'router'})],
	// visual_navTopic: (s, p) => [Object.assign(Logic.getRoute(s.topic, p.index), {$tag: 'router'})],
	
	visual_panelData: (s, p) => [Object.assign(p, {$tag: 'hub', $fw: 'visual_panel'})],
};
