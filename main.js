import Launcher from './views/launcher.js'
import Page from './views/page.js'
import FluidLayout from './lib/FluidLayout.js'

var Surface = Samsara.DOM.Surface;


var Context = Samsara.DOM.Context;

var context = new Context(),
		launcher = new Launcher(),
		page = new Page(),
		s1 = new Surface({properties: {background: 'red'}}),
		s2 = new Surface({properties: {background: 'green'}}),
		s3 = new Surface({properties: {background: 'blue'}}),
		s4 = new Surface({properties: {background: 'yellow'}}),
		fl = new FluidLayout({
			items: [s1, s2, s3, s4],
			layers: {
				l1: {
					name: 'l1',
					items: [s1, s2],
					corners: [0, 50, 1, .4],
					surface: {properties: {background: 'lightgrey'}},
					baseZ: 1,
					handleZ: 2,
					margin: [12, 12],
					packer: null
				},
				l2: {
					name: 'l2',
					items: [s3, s4],
					corners: [-.4, .6, -50, -50],
					surface: {properties: {background: 'darkgrey'}},
					baseZ: 3,
					handleZ: 4,
					packer: null
				}
			}
		});

// context.add(launcher);
// context.add(page);

context.add({proportions: [.8, .8], origin: [.5, .5], align: [.5, .5]}).add(fl);

context.setPerspective(1.2 * Math.sqrt(screen.height ** 2 + screen.width ** 2));
context.mount(document.body);
