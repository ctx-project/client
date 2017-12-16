import Launcher from '../views/launcher.js'
import Page from '../views/page.js'
import Panel from '../views/panel.js'
import * as H from '../lib/helper.js'

var Context = Samsara.DOM.Context,
		xs = xstream.default;

export default function(mount) {
var context, launcher, page, panels = {}, enter = [], emitter,
		
		driver = pattern$ => {
			pattern$.addListener({next: p => rules[p.$type](p)});
			
			return xs.create({
				start: function (e) { emitter = e;},
				stop: function () {emitter = null;},
			}); 
		},
		
		rules = {
			init() {
				context = new Context();
				launcher = new Launcher();
				page = new Page();
				
				context.add(launcher);
				context.add(page);
				
				page.on('pass', emitter.next.bind(emitter));
				page.autosuggest.on('update', search => emitter.next({$type: 'search', search}));
				
				context.setPerspective(1.2 * Math.sqrt(screen.height ** 2 + screen.width ** 2));
				context.mount(mount);
			},
			
			hints({hints}) {
				page.autosuggest.setResults(hints);
			},
			
			views({views, topic}) {
				//diff
				
				var requestLayout = H.debounce(() => {
					if(enter.length) { page.swipeMain(enter); enter = []; }
					else page.layoutMain();
				}, 100);

				Object.values(views).forEach(record => { 
					var panel = new Panel({record, topic});
					
					panel.on('pass', emitter.next.bind(emitter));
					panel.on('requestLayout', requestLayout);
					
					panels[record.id] = panel;
					enter.push(panel);
					
					panel.init();
				});
			},
			
			items({id, text}) {
				var panel = panels[id];
				if(panel) panel.setItems(text);
			}
		};
		
		// var updateViewsD = debounce(update);
		
		// function updateViews(views) {
			
		// }
		
		return driver;
}