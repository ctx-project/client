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

		this.layout = new FluidLayout({
			properties: {zIndex: 1},
			layers: [{
					name: 'main',
					items: Array(10).fill().map((_, i) => new Surface({properties: {background: colors[i % colors.length]}, content: i})),
					corners: [0, options.barHeight, 1, -options.barHeight],
					baseZ: 0, //dragZ: 1,
					packer: (items, size) => randomPacker(items, size, 150, mainSizer),
					handler: () => this.defocus().deover(),
					gestures: {
						'tap': this.focus.bind(this),
						'bottom.throw': this.minimize.bind(this),
						// 'bottom.drag': this.revealTop.bind(this),
						'top.throw': this.maximize.bind(this),
						// 'top.drag': this.prioritize.bind(this),
						// 'right.throw': this.pin.bind(this),
						// 'right.drag': this.revealLeft.bind(this),
						'left.throw': this.navigate.bind(this),
						// 'left.drag': this.embed.bind(this),
						'default': item => this.layout.returnItem(item)
					}
				}, {
					name: 'focus',
					corners: [0, options.barHeight, 1, -options.barHeight],
					baseZ: 2, //dragZ: 3,
					transform: {scale: [1.1, 1.1, 1]},
					handler: () => this.deover(),
					gestures: {
						'parent': 'main',
						'tap': item => this.defocus()//.focus(item),
					}
				}, {
					name: 'over',
					corners: [0, options.barHeight, 1, -options.barHeight],
					baseZ: 4, //dragZ: 5,
					packer: (items, size) => centerPacker(items, size, overSizer),
					
				}, {
					name: 'leads',
					corners: [0, -options.barHeight, 1, 1],
					baseZ: 6, //dragZ: 7,
					birth: [1, .5],
					packer: (items, size) => randomPacker(items, size, 150, leadsSizer),
					handler: () => this.deover(),
					
				}, {
					name: 'maxi',
					corners: [0, 0, 1, 1],
					baseZ: 8, //dragZ: 9,
					packer: (items, size) => maxiPacker(items, size),
					gestures: {
						'parent': 'focus',
						'tap': () => {},
						'bottom.throw': this.normalize.bind(this),
					}
				},
			]
		});
		
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
		this.handle.subscribe(this.container);
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
	},

	hasItems: function(layer) {
		return this.layout.getLayer(layer).items.length;
	},
	
	focus: function(panel) {
		var layout = this.layout,
				main = layout.layers.main,
				focus = layout.layers.focus;
		
		layout.projectItem(panel, focus);
		add();
		add();

		layout.setLayerOpacity(main, .5).transformLayer(main, {scale: [.5, .5, 1]});
					// .transformLayer(focus, {scale: [1.1, 1.1, 1]});
		
		function add() {
			var item = main.items[Math.floor(Math.random() * main.items.length)];
			if(item != panel) layout.projectItem(item, focus);
		}
	},
	
	defocus: function() {
		if(this.hasItems('focus'))
			this.layout.backLayer('focus').setLayerOpacity('main', 1).retransformLayer('main');
		
		return this;
	},
	
	over: function(panel) {
		var l = this.layout;
		// l.switchItem(panel, l.layers.focus);
		// l.opacityLayer(l.layers.main, .5);
	},
	
	deover: function() {
		
	},
	
	minimize: function(panel) {
		l('minimize');
	},
	
	maximize: function(panel) {
		this.layout.projectItem(panel, 'maxi').layoutLayer('maxi');
	},
	
	normalize: function(panel) {
		this.layout.backItem(panel).returnItem(panel);
	},
	
	prioritize: function(panel) {
		l('prioritize');
	},
	
	revealTop: function(panel) {
		l('revealTop');
	},
	
	revealLeft: function(panel) {
		l('revealLeft');
	},
	
	pin: function(panel) {
		l('pin');
	},
	
	embed: function(panel) {
		l('embed');
	},
	
	navigate: function(panel) {
		l('navigate');
	},
});

//---

var colors = ["#b71c1c", "#880e4f", "#4a148c", "#311b92", "#1a237e", "#006064", "#33691e", "#ff6f00", "#e65100"];

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
		margins: [12, 12]
	}));
} 

function horizontalPacker(items, size, sizer) {
	var distance = 0;
	return items.map((item, ix) => ({
		item, 
		size: sizer(item), 
		position: [distance, (size[1] - sizer(item)[1]) / 2],
		margins: [50, 50],
		cuc: distance += sizer(item)[0]
	}));
}

function centerPacker(items, size, sizer) {
	var itemSize = sizer(items[0]);
	return items.map((item, ix) => ({
		item, 
		size: itemSize, 
		position: [(size[0] - itemSize[0]) / 2, (size[1] - itemSize[1]) / 2],
		margins: [0, 0]
	}));
}

function maxiPacker(items, size) {
	return items.map((item, ix) => ({
		item, 
		size, 
		position: [0, 0],
		margins: [0, 0]
	}));
}

function mainSizer(item) { return [300, 300]; }
function focusSizer(item) { return [400, 400]; }
function overSizer(item) { return [500, 500]; }
function leadsSizer(item) { return [200, 30]; }







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
// 			setSize: panel => Fit.setLinkSize(panel)
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

