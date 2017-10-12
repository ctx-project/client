import Launcher from './views/launcher.js'
import Page from './views/page.js'
var Context = Samsara.DOM.Context;

var context = new Context(),
		launcher = new Launcher(),
		page = new Page();

context.add(launcher);
context.add(page);

context.setPerspective(1.2 * Math.sqrt(screen.height ** 2 + screen.width ** 2));
context.mount(document.body);
