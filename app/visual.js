import Launcher from '../views/launcher.js'
import Page from '../views/page.js'
import Panel from '../views/panel.js'

var Context = Samsara.DOM.Context,
		xs = xstream.default;

export default function(mount) {
var context, launcher, page, panels, emitter,
		
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
				
				page.autosuggest.on('update', search => emitter.next({$type: 'search', search}));
				
				context.setPerspective(1.2 * Math.sqrt(screen.height ** 2 + screen.width ** 2));
				context.mount(mount);
			},
			
			hints({hints}) {
				page.autosuggest.setResults(hints);
			},
			
			views({views}) {
				panels = {};
				
				page.swipeMain(Object.values(views).map(record => { 
					var panel = new Panel({record});
					panels[record.id] = panel;
					panel.on('pass', emitter.next.bind(emitter));
					panel.init();
					return panel;
				}));
			},
			
			items({id, text}) {
				panels[id].setItems(text);
			}
		};
		
		// var updateViewsD = debounce(update);
		
		// function updateViews(views) {
			
		// }
		
		return driver;
}