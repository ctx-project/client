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
		barHeight: 50,
		margin: 12,
		minimized: false,
		minimizedOpacity: .3,
	},
	
	initialize: function(options) {
		
		this.container = new ContainerSurface({
			origin: [0, 1],
			properties: {
				background: '#EEEEEE',
				overflow: 'hidden'
			}
		});
	
		this.menu = new ContainerSurface({
			size: [undefined, options.barHeight],
			// properties: {background: 'red'}
		});

		this.layout = new FluidLayout({
			properties: {zIndex: 1},
			layers: [{
					name: 'main',
					items: Array(8).fill().map((_, i) => new Surface({classes: ['panel'], properties: {background: colors[i % colors.length]}, content: i})),
					corners: [0, options.barHeight, 1, -options.barHeight],
					baseZ: 0, //dragZ: 1,
					packer: (items, size) => Pack.pressureArea(items, size, 
						() => [350, 450],
						[t => Math.random()],
						t => 1,
						t => false
					),
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
					transform: {scale: [1.015, 1.015, 1]},
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
					packer: (items, size) => Pack.horizontalLine(items, size, () => [200, 50], options.margin),
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
					packer: (items, size) => Pack.contain(items, size, () => [300, 300], [2 * options.margin, 2 * options.margin]),
					gestures: {
						'tap': this.include.bind(this),
						'top': this.maximize.bind(this),
						'bottom': this.reminimize.bind(this),
					}
				}, {
					name: 'maxi',
					corners: [0, 0, 1, 1],
					baseZ: 8, //dragZ: 9,
					packer: (items, size) => Pack.fill(items, size),
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
		
		this.minimized = false;
		this.handle = new TouchInput();
		this.handle.subscribe(this.menu);
		this.handle.subscribe(this.overlay);
		this.handle.on('end', this.toggle.bind(this));
		
		if(options.minimized) this.toggle();
	},
	
	toggle: function() {
		this.translate$.set(this.minimized ? 0 : 500, this.options.transition);
		this.opacity$.set(this.minimized ? 1 : this.options.minimizedOpacity, this.options.transition);
		this.minimized = !this.minimized;
		var props = this.overlay.getProperties();
		props.display = this.minimized ? 'block' : 'none';
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

//	 setPanelSize: function(panel, margin) {
//		 panel.desired = panel.viewer.desired();
//		 panel.width = Math.ceil(Math.max(panel.desired[0], panel.ctx.query.length / 5)) + Const.hmargins[panel.Viewer.type] + margin;
//		 panel.height = Math.ceil(panel.desired[1]) + Const.vmargins[panel.Viewer.type] + margin;
//	 },
	
//	 setLinkSize: function(panel) {
//		 panel.width = Math.ceil(panel.ctx.query.length / 5) + Const.umargin;
//		 panel.height = 1 + Const.umargin;
//	 },

//	 area: function(tiles, width, height, minWidth, minHeight) {
//		 return	 this.screenArea.apply(this, arguments) || 
//						 this.pageArea.apply(this, arguments);
//	 },


// function getRank() {
// 	//?many importants, info
// 	var imp = trial.find(t => t.tile.flags.important),
// 			supp = trial.find(t => t.tile.flags.support);
			
// 	return	 getAreaRank() * .6 + 
// 					getRightRank(imp) * .15 + getTopRank(imp) * .05 + 
// 					getRightRank(supp) * .15 + getBottomRank(supp) * .05;
// }
// function getAreaRank() {
// 	return trial.length ? trial.map(t => t.width * t.height).reduce((a,b) => a + b) / trial.map(t => t.tile.width * t.tile.height).reduce((a,b) => a + b) : 1;
// }
// function getRightRank(imp) {
// 	return imp ? imp.fit.x / (trial.map(t => t.fit.x).reduce((a,b) => Math.max(a, b)) || 1) : 1;
// }
// function getTopRank(imp) {
// 	return imp ? 1 - imp.fit.y / (trial.map(t => t.fit.y).reduce((a,b) => Math.max(a, b)) || 1) : 1;
// }
// function getBottomRank(imp) {
// 	return imp ? imp.fit.y / (trial.map(t => t.fit.y).reduce((a,b) => Math.max(a, b)) || 1) : 1;
// }

// function scale() {
// 	var scaled = false;
// 	trial.forEach(t => {
// 		if(t.width > 4) {t.width = t.width - 1; scaled = true;}
// 		if(t.height > 4) {t.height = t.height - 1; scaled = true;}
// 	});
// 	return scaled;
// }

// rand: (t1, t2) => t1.rand - t2.rand,

// orders: [
// 	(t1, t2) => t1.tile.flags.main ? -1 : t2.tile.flags.main ? 1 : (Math.max(t1.width, t1.height) - Math.max(t2.width, t2.height)),
// 	(t1, t2) => t1.tile.flags.main ? -1 : t2.tile.flags.main ? 1 : (t1.width * t1.height - t2.width * t2.height),
// 	(t1, t2) => t1.tile.flags.main ? -1 : t2.tile.flags.main ? 1 : (t1.width - t2.width),
// 	(t1, t2) => t1.tile.flags.main ? -1 : t2.tile.flags.main ? 1 : (t1.height - t2.height),
// 	this.rand, this.rand, this.rand, this.rand, this.rand, this.rand
// ],

// if(ordering == this.rand) trial.forEach(t => t.rand = t.tile.flags.main ? 1 : Math.random());


//---

var colors = ["#311b92", "#673ab7", "#1b5e20", "#c2185b", "#673ab7", "#673ab7", "#388e3c", "#9e9d24", "#e65100"];


// 		Var.conn = new CtxConnection(window.location.href, 'andrei');
// 		this.fetchTopic('*View.1');
	
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

