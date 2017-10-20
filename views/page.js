import FluidLayout from '../lib/FluidLayout.js'
import * as Pack from '../lib/pack.js'


var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		ContainerSurface = Samsara.DOM.ContainerSurface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		TouchInput = Samsara.Inputs.TouchInput;

export default View.extend({
	defaults: {
		transition: {curve: 'easeInCubic', duration: 170 },
		minimised: false,
		barHeight: 50,
		margin: 12
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
					packer: (items, size) => Pack.randomPack(items, size, () => [300, 300]),
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
					handler: this.deover.bind(this),
					gestures: {
						'parent': 'main',
						'tap': item => this.defocus()//.focus(item),
					}
				}, {
					name: 'leads',
					corners: [options.margin, -options.barHeight, 1, 1],
					baseZ: 6, //dragZ: 7,
					birth: [1, .5],
					packer: (items, size) => Pack.horizontalLinePack(items, size, () => [200, 50], options.margin),
					handler: this.deover.bind(this),
					gestures: {
						'tap': this.over.bind(this),
						'top.drag': this.include.bind(this),
						'top.throw': this.maximize.bind(this),
					}
				}, {
					name: 'over',
					corners: [0, options.barHeight, 1, -options.barHeight],
					baseZ: 4, //dragZ: 5,
					packer: (items, size) => Pack.containPack(items, size, () => [300, 300], [2 * options.margin, 2 * options.margin]),
					gestures: {
						'tap': this.include.bind(this),
						'top': this.maximize.bind(this),
						'bottom': this.reminimize.bind(this),
					}
				}, {
					name: 'maxi',
					corners: [0, 0, 1, 1],
					baseZ: 8, //dragZ: 9,
					packer: (items, size) => Pack.fillPack(items, size),
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
	
	minimize: function(panel) {
		this.layout.switchItem(panel, 'leads').layoutLayer('leads').layoutLayer('main');
	},
	
	reminimize: function(panel) {
		this.layout.backItem(panel).returnItem(panel);
	},
	
	over: function(panel) {
		this.layout.projectItem(panel, 'over').layoutLayer('over');
	},
	
	deover: function() {
		if(this.hasItems('over'))
			this.layout.backLayer('over').layoutLayer('leads');
	},
	
	include: function(panel) {
		this.defocus();
		this.layout.switchItem(panel, 'main').layoutLayer('leads').layoutLayer('main');
	},
	
	maximize: function(panel) {
		this.layout.projectItem(panel, 'maxi').layoutLayer('maxi');
	},
	
	normalize: function(panel) {
		this.layout.backItem(panel).returnItem(panel);
	},
		
	navigate: function(panel) {
		l('navigate');
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
});

//---

var colors = ["#b71c1c", "#880e4f", "#4a148c", "#311b92", "#1a237e", "#006064", "#33691e", "#ff6f00", "#e65100"];







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

