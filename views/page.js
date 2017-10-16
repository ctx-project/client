import FluidLayout from '../lib/FluidLayout.js'

var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		ContainerSurface = Samsara.DOM.ContainerSurface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		Stream = Samsara.Streams.Stream,
		TouchInput = Samsara.Inputs.TouchInput;

export default View.extend({
	defaults: {
		transition: {curve: 'easeInCubic', duration: 150 },
		minimised: false,
		barHeight: 50
	},
	
	initialize: function(options) {
		this.container = new ContainerSurface({
			origin: [0, 1],
			properties: {
				background: 'white'
			}
		});
	
		this.menu = new ContainerSurface({
			size: [undefined, options.barHeight],
			properties: {background: 'red'}
		});
		
		this.layout = new FluidLayout(getFluidSetup({
			properties: {zIndex: 1}
		}, this));
		
		this.overlay = new Surface({
			properties: {zIndex: 2, display: 'none'},
		});
		
		this.container.add(this.menu);
		this.container.add(this.layout);
		this.container.add(this.overlay);
		
		this.translate$ = new Transitionable(0);
		this.opacity$ = new Transitionable(1);
		
		this.add({
			align: [0, 1],
			transform: this.translate$.map(t => Transform.translate([0, 2.5 * t, -4 * t])),
			opacity: this.opacity$,
		}).add(this.container);
		
		this.minimised = false;
		this.handle = new TouchInput();
		this.handle.subscribe(this.menu);
		this.handle.subscribe(this.overlay);
		this.handle.on('end', this.toggle.bind(this));
		
		if(options.minimised) this.toggle();
	},
	
	toggle: function() {
		this.translate$.set(this.minimised ? 0 : 300, this.options.transition);
		this.opacity$.set(this.minimised ? 1 : .5, this.options.transition);
		this.minimised = !this.minimised;
		var props = this.overlay.getProperties();
		props.display = this.minimised ? 'block' : 'none';
		this.overlay.setProperties(props);
	}
});

function getFluidSetup(setup, page) {
	var options = page.options;
	setup.layers = [{
			name: 'main',
			items: getPanels(10, page),
			corners: [0, options.barHeight, 1, -options.barHeight],
			// surface: {properties: {background: 'rgba(0,255,0,.5)'}},
			birth: {position: [window.innerWidth / 2, window.innerHeight / 2]},
			packer: (items, size) => randomPacker(items, size, 150, sizer),
		}, {
			name: 'focus',
			items: [],
			corners: [0, options.barHeight, 1, -options.barHeight],
			// surface: {properties: {background: 'rgba(0,0,255,.3)'}},
		}, {
			name: 'over',
			items: [],
			corners: [0, options.barHeight, 1, -options.barHeight],
			// surface: {properties: {background: 'rgba(255,0,0,.3)'}},
		}, {
			name: 'leads',
			items: [],
			corners: [0, -options.barHeight, 1, 1],
			// surface: {properties: {background: 'rgba(0,0,255,.3)'}},
			birth: {position: [window.innerWidth, window.innerHeight]}
		}, {
			name: 'maxi',
			items: [],
			corners: [0, 0, 1, 1],
			// surface: {properties: {background: 'rgba(0,0,0,.5)'}},
		},
	];
	
	return setup;
}

function getPanels(count, page) {
	var panels = [];
	for(let i = 0; i < count; i++)
		panels.push(buildPanel(i, page));
	return panels;
}

var colors = ["#b71c1c", "#880e4f", "#4a148c", "#311b92", "#1a237e", "#006064", "#33691e", "#ff6f00", "#e65100"];

function buildPanel(ix, page) {
	var s = new Surface({properties: {background: colors[ix % colors.length]}, content: ix}),
			handle = new Samsara.Inputs.TouchInput();

	handle.subscribe(s);
	handle.on('start', e => page.layout.startDragItem(s));
	handle.on('update', e => page.layout.dragItem(s, e.delta));
	handle.on('end', e => {
		page.layout.endDragItem(s);
		screen(s, e, page);
		// page.layout.returnItem(s);
		// layout.switchLayer(s1, layout.layers.l2); 
		// layout.setLayerOpacity(layout.layers.l1, .5);
	});

	return s;
}
var Const = {
	margin: 10,
	umargin: 0.27,
	barHeight: 32,
	throwSpeed: 7,
	tapDistance: 10,
	curve: {curve : 'easeOut', duration: 500},
	vpadding: {contain: 1.33, cover: 0, small: 1},
	hpadding: {contain: .66, cover: 0, small: .5},
}

function screen(panel, e, page) {
	var vx = e.velocity[0],
		vy = e.velocity[1],
		vxa = Math.abs(vx),
		vya = Math.abs(vy),
		v = Math.max(vxa, vya),
		isThrow = vx * vx + vy * vy > Const.throwSpeed,
		cumulate = e.cumulate,
		distance = Math.pow(cumulate[0], 2) + Math.pow(cumulate[1], 2),
		isTap = distance < Const.tapDistance,
		// type = panel.layer.type,
		other = page.layout.layers.over.items[0];
	
	// if(other && other != panel) minimize(other);

	// if(type == 'links') {
	// 	if(isTap)
	// 		this.incorporate(panel, 'over')
	// 	else if(v == -vy)
	// 		if(isThrow) this.maximize(panel, page); else this.incorporate(panel, 'static');
	// 	else
	// 		page.layout.returnItem(panel);
			
	// 	return;	
	// }	

	if(isTap)	
		if(type == 'static') ; else incorporate(panel, 'static');
	else if(v == vy)
		if(isThrow) minimize(panel, page); else revealTop(panel, page);
	else if(v == -vy) 
		if(isThrow) maximize(panel, page); else revealBottom(panel, page);
	else if(v == vx)
		if(isThrow) stikyfy(panel, page); else revealLeft(panel, page);
	else 
		if(isThrow) share(panel, page); else revealRight(panel, page);
}

function minimize(panel, page) {
	page.layout.switchLayer(panel, page.layout.layers.leads);
}

function incorporate(panel, page, type) {
}

function maximize(panel, page) {
	page.layout.returnItem(panel);
}

function share(panel, page) {
	page.layout.returnItem(panel);
}

function stikyfy(panel, page) {
	page.layout.returnItem(panel);
}

function revealTop(panel, page) {
	page.layout.returnItem(panel);
}

function revealBottom(panel, page) {
	page.layout.returnItem(panel);
}

function revealLeft(panel, page) {
	page.layout.returnItem(panel);
}

function revealRight(panel, page) {
	page.layout.returnItem(panel);
}

function tap(e) {
	l(e.path[1].panel);
}			



function randomPacker(items, size, granularity, sizer) {
	Math.random = (function() {
		var seed = 0x2F6E2B1;
		return function() {
			// Robert Jenkins’ 32 bit integer hash function
			seed = ((seed + 0x7ED55D16) + (seed << 12))	& 0xFFFFFFFF;
			seed = ((seed ^ 0xC761C23C) ^ (seed >>> 19)) & 0xFFFFFFFF;
			seed = ((seed + 0x165667B1) + (seed << 5))	 & 0xFFFFFFFF;
			seed = ((seed + 0xD3A2646C) ^ (seed << 9))	 & 0xFFFFFFFF;
			seed = ((seed + 0xFD7046C5) + (seed << 3))	 & 0xFFFFFFFF;
			seed = ((seed ^ 0xB55A4F09) ^ (seed >>> 16)) & 0xFFFFFFFF;
			return (seed & 0xFFFFFFF) / 0x10000000;
		};
	}());
	
	return items.map((item, ix) => ({
		item, 
		size: sizer(item), 
		position: [Math.min(Math.random(), .8) * size[0], Math.min(Math.random(), .8) * size[1]], 
		margins: [0, 0]
	}));
} 

function sizer(item) {
	 return [100, 100];
}
		
		
		
		









// var Var = {},
// 		Context = Samsara.DOM.Context,
// 		Surface = Samsara.DOM.Surface,
// 		ContainerSurface = Samsara.DOM.ContainerSurface,
// 		Transform = Samsara.Core.Transform,
// 		Transitionable = Samsara.Core.Transitionable,
// 		MouseInput = Samsara.Inputs.MouseInput,
// 		TouchInput = Samsara.Inputs.TouchInput,
// 		GenericInput = Samsara.Inputs.GenericInput,
// 		Accumulator = Samsara.Streams.Accumulator,
// 		Differential = Samsara.Streams.Differential;

// GenericInput.register({
// 	 mouse : MouseInput,
// 	 touch : TouchInput,
// });

// var Page = {
// 	init: function() {
// 		Var.context = new Context();
// 		Var.context.mount(document.body);
		
// 		Var.container = Var.context
// 			.add({
// 				// transform: Transform.scale([.5, .5, .5])
// 				//proportions: [.5, .5],
// 			});
// 			// .add(new ContainerSurface({
// 			// 	proportions: [.5, .5],
// 			// 	properties: {background: 'red'}
// 			// }));
// 		Var.frame = Var.container.add({
// 			margins: [Const.margin, 2 * Const.barHeight], 
// 			origin: [1, .5], 
// 			align: [1, .5],
// 		});
		
// 		Var.static = {
// 			type: 'static', 
// 			panels: [], 
// 			fit: Fit.area.bind(Fit),
// 			setSize: panel => Fit.setPanelSize(panel, Const.umargin)
// 		};
// 		Var.over = {
// 			type: 'over', 
// 			panels: [], 
// 			fit: Fit.center.bind(Fit),
// 			setSize: panel => Fit.setPanelSize(panel, 0)
// 		};
// 		Var.links = {
// 			type: 'links', 
// 			panels: [], 
// 			fit: Fit.horizontal.bind(Fit),
// 			setSize: panel => Fit.setLinkSize(panel, page)
// 		};

// 		window.onresize = () => { 
// 			Page.layout(Var.static);
// 			Page.layout(Var.over);
// 		}
		
// 		Var.theme = new Themes[0];
		
// 		Var.conn = new CtxConnection(window.location.href, 'andrei');
		
// 		this.fetchTopic('*View.1');
// 	},
	
// 	fetchTopic: function(phrase) {
// 		Var.conn.sub().get(phrase, text => {
// 			text.split('\n')
// 					.map(Panel.create)
// 					.sort((a, b) => a.id - b.id)
// 					.forEach((p, i, panels) => {
// 						Panel.prepare(p, panels).ctx.get('', addPanel);
// 					});
// 		});
		
// 		function addPanel(text, ctx) {
// 			ctx.panel.text = text;
// 			Panel.add(ctx.panel, Var.static);
// 		}
// 	},
	
// 	unitSize: function(size) {
// 		return size / 75;
// 	},
	
// 	frameWidth: function() {
// 		return window.innerWidth - Const.margin;
// 	},
	
// 	frameHeight: function() {
// 		return window.innerHeight - 2 * Const.barHeight;
// 	},
	
// 	frameUnitWidth: function() {
// 		return this.unitSize(this.frameWidth());
// 	},
	
// 	frameUnitHeight: function() {
// 		return this.unitSize(this.frameHeight());
// 	},
	
// 	_layouts: new Map(),
// 	layout: function(layer) {
// 		var lo = this._layouts.get(layer);
// 		if(!lo) {
// 			lo = Helper.debounce(function() {
// 				var width = this.frameUnitWidth(),
// 						height = this.frameUnitHeight(),
// 						fit = layer.fit(layer.panels, width, height, 2, 2);
		
// 				if(!fit) return;
		
// 				fit.forEach(t => Panel.move(t.tile, {
// 					proportions: [t.width / width, t.height / height], 
// 					align: [t.fit.x / width, t.fit.y / height]
// 					}));
// 			}.bind(this), 100);

// 			this._layouts.set(layer, lo);
// 		}
		
// 		lo();
// 	},
	
// 	backdrop: function(toggle) {
// 		Var.static.panels.forEach(p => Var.theme.backdrop(p, toggle));
// 	}
// }

