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
			layers: {
				l1: {
					name: 'l1',
					items: [s1, s2],
					corners: [.1, 50, 1, .4],
					surface: {properties: {background: 'lightgrey'}},
					baseZ: 1,
					handleZ: 2,
					packer: (items, size) => testPackerH(items, size, 150, sizer),
					birth: {
						position: [2000, 500, 0],
						size: [2000, 2000]
					}
				},
				l2: {
					name: 'l2',
					items: [s3, s4],
					corners: [-.4, .6, -50, -50],
					surface: {properties: {background: 'darkgrey'}},
					baseZ: 3,
					handleZ: 4,
					margins: [12, 12],
					packer: (items, size) => testPackerV(items, size, 130, sizer),
					birth: {
						position: [-500, 500, 0],
						size: [200, 200]
					}
				}
			}
		});

// context.add(launcher);
// context.add(page);

context.add({proportions: [.8, .8], origin: [.5, .5], align: [.5, .5]}).add(fl);

context.setPerspective(1.2 * Math.sqrt(screen.height ** 2 + screen.width ** 2));
context.mount(document.body);


function testPackerH(items, size, granularity, sizer) {
	return items.map((item, ix) => ({item, size: sizer(item), position: [ix * granularity, 0]}));
} 

function testPackerV(items, size, granularity, sizer) {
	return items.map((item, ix) => ({item, size: sizer(item), position: [0, ix * granularity]}));
} 

function sizer(item) {
	return [100, 100];
}