import Launcher from '../views/launcher.js'
import Page from '../views/page.js'

var Context = Samsara.DOM.Context,
		xs = xstream.default;

export default function(mount) {
	var context, launcher, page, cmds = {};
	var listener;
		
	cmds.init = function() {
		context = new Context();
		launcher = new Launcher();
		page = new Page();
		
		context.add(launcher);
		context.add(page);
		
		//?
		page.autosuggest.on('update', s => listener.next(s));
		
		context.setPerspective(1.2 * Math.sqrt(screen.height ** 2 + screen.width ** 2));
		context.mount(mount);
	};
	
	cmds.hints = function({hints}) {
		page.autosuggest.setResults(hints);
	};
	
	return cmd$ => {
		cmd$.addListener({next: cmd => cmds[cmd.type](cmd)});
		
		return xs.create({
			start: function (l) {
				listener = l;
			},
		
			stop: function () {
			},
		}); 
	}
}