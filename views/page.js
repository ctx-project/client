import FluidLayout from '../lib/FluidLayout.js'
import Autosuggest from '../lib/Autosuggest.js'
import * as Pack from '../lib/pack.js'
import {random} from '../lib/helper.js'


var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		ContainerSurface = Samsara.DOM.ContainerSurface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		TouchInput = Samsara.Inputs.TouchInput;

export default View.extend({
	defaults: {
		transition: {curve: 'easeInCubic', duration: 270 },
		barHeight: 50,
		margin: 8,
		minimized: false,
		minimizedOpacity: .3,
		decrement: 50,
		minSize: [100, 100],
		leadSize: [300, 300]
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

		var randO = t => Math.random(),
				mainPacker = (items, size) => Pack.pressureArea(items, size, 
				 sizer.bind(this),
				 [
					 t => 1 / Math.max(t.width, t.height),
					 t => 1 / (t.width * t.height),
					 t => 1 / t.width,
					 t => 1 / t.height,
					 randO, randO, randO, randO, randO, randO
				 ],
				 trialRank,
				 trialResize.bind(this),
				 [options.margin / 2, options.margin / 2] //? fix: i get double the margin; dunno why
			 );

		this.layout = new FluidLayout({
			properties: {zIndex: 1},
			layers: [{
					name: 'main',
					corners: [0, options.barHeight, 1, -options.barHeight],
					margins: [options.margin, options.margin, 0, 0],
					baseZ: 0, //dragZ: 1,
					packer: mainPacker,
					handler: () => this.defocus().deover(),
					gestures: {
						'tap': this.focus.bind(this),
						'bottom.throw': this.exclude.bind(this),
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
					name: 'mainPrev',
					corners: [-2, options.barHeight, 0, -options.barHeight],
					margins: [options.margin, options.margin, 0, 0],
					baseZ: 0, //dragZ: 1,
					packer: mainPacker,
				}, {
					name: 'mainNext',
					corners: [1, options.barHeight, 2, -options.barHeight],
					margins: [options.margin, options.margin, 0, 0],
					baseZ: 0, //dragZ: 1,
					packer: mainPacker,
				}, {
					name: 'focus',
					corners: [0, options.barHeight, 1, -options.barHeight],
					baseZ: 2, //dragZ: 3,
					transform: {scale: [1.015, 1.015, 1]},
					handler: this.deover.bind(this),
					gestures: {
						'inherit': 'main',
						'tap': item => this.defocus()//.focus(item),
					}
				}, {
					name: 'leads',
					corners: [0, -options.barHeight, 1, 1],
					margins: [options.margin, 0, 0, 0],
					baseZ: 4, //dragZ: 7,
					birth: [1, .5],
					surface: {
						classes: ['layer'], 
						opacity: 0, 
						gestures: {
							'default': this.toggleLeads.bind(this)
						},
						properties: {zIndex: 3}
					},
					packer: (items, size) => Pack.horizontalLine(items, size, this.getLeadSize.bind(this), options.margin),
					handler: this.deover.bind(this),
					gestures: {
						'tap': this.over.bind(this),
						'top.drag': this.include.bind(this),
						'top.throw': this.maximize.bind(this),
					}
				}, {
					name: 'over',
					corners: [0, options.barHeight, 1, -options.barHeight],
					margins: [options.margin, options.margin, options.margin, options.margin],
					baseZ: 6, //dragZ: 5,
					packer: (items, size) => Pack.contain(items, size, () => [300, 300]),
					gestures: {
						'tap': this.include.bind(this),
						'top': this.maximize.bind(this),
						'bottom': this.deover.bind(this),
						'left.throw': this.navigate.bind(this),
					}
				}, {
					name: 'maxi',
					corners: [0, 0, 1, 1],
					baseZ: 8, //dragZ: 9,
					packer: Pack.fill,
					gestures: {
						'bottom.throw': this.normalize.bind(this),
						'right.throw': this.goPrevSiebling.bind(this),
						'left.throw': this.goNextSiebling.bind(this),
					}
				}, {
					name: 'maxiPrev',
					corners: [-2, 0, 0, 1],
					baseZ: 8, //dragZ: 1,
					packer: Pack.fill,
				}, {
					name: 'maxiNext',
					corners: [1, 0, 2, 1],
					baseZ: 8, //dragZ: 1,
					packer: Pack.fill,
				},
			]
		});
		
		this.overlay = new Surface({
			properties: {zIndex: 2, display: 'none'},
		});
		
		this.container.add(this.menu);
		this.container.add(this.layout);
		this.container.add(this.overlay);
		
		this.leadsHeight = options.leadSize[1] + options.barHeight + 5 * options.margin;
		this.autosuggestToggle$ = new Transitionable(0);
		this.autosuggest = new Autosuggest({width: 550, inputHeight: options.barHeight, contentHeight: options.leadSize[1], zIndex: 4, placeholder: 'Search in Travel ...'});

		this.container.add({
			align: [.5, 1],
			transform: this.autosuggestToggle$.map(t => Transform.compose(
				Transform.translateY(-t * (this.leadsHeight - 2 * options.margin)),
				Transform.scaleY(t)
			)),
			opacity: this.autosuggestToggle$
		}).add(this.autosuggest);
		
		this.autosuggest.on('start', () => this.layout.forEachItem('leads', 'remove'));
		this.autosuggest.on('end', v => { 
			this.layout
				.forEachItem('leads', 'remove')
				.forEachItem(getItems(4), 'add', 'leads')
				.layoutLayer('leads');
		});
		// this.autosuggest.on('update', search => this.autosuggest.setResults(Array(5).fill().map(() => `${search} ${Math.random()}`)));

		
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
			this.layout.forEachItem('focus', 'back').setLayerOpacity('main', 1).retransformLayer('main');
		return this;
	},
	
	include: function(panel) {
		this.defocus();
		this.layout.switchItem(panel, 'main').layoutLayer('leads').layoutLayer('main');
	},
	
	exclude: function(panel) {
		this.layout.switchItem(panel, 'leads').layoutLayer('leads').layoutLayer('main');
	},
	
	// reminimize: function(panel) {
	//	 this.layout.backReturnItem(panel);
	// },
	
	over: function(panel) {
		this.layout.projectItem(panel, 'over').layoutLayer('over');
	},
	
	deover: function() {
		if(this.hasItems('over'))
			this.layout.forEachItem('over', 'back').layoutLayer('leads');
	},
	
	maximize: function(panel) {
		this.layout.projectItem(panel, 'maxi').layoutLayer('maxi');
	},
	
	normalize: function(panel) {
		this.layout.backReturnItem(panel);
		return this;
	},
	
	goNextSiebling: function(panel) {
		this.swipeItems([this.getSiebling(panel, +1)], 'maxi', 'maxiNext', 'maxiPrev', 'reproject');
	},
		
	goPrevSiebling: function(panel) {
		this.swipeItems([this.getSiebling(panel, -1)], 'maxi', 'maxiPrev', 'maxiNext', 'reproject');
	},
		
	getSiebling: function(panel, delta) {
		var layer = this.layout.getItemBacks(panel).reduce((a, b) => b.items.length > 1 ? b : a),
				items = layer.items,
				ix = (items.indexOf(panel) + delta + items.length) % items.length,
				sieb = items[ix];
		return sieb == panel ? null : sieb;
	},
	
	swipeItems: function(items, target, enter, exit, method) {
		if(!items || !items[0]) return;
		this.layout
			.forEachItem(target, method, exit).layoutLayer(exit).onTransitionEnd(() => this.layout.forEachItem(exit, {switch: 'remove', reproject: 'backReturn'}[method]))
			.forEachItem(items, {switch: 'add', reproject: 'project'}[method], enter).quickLayoutLayer(enter).forEachItem(enter, method, target).layoutLayer(target);
	},

	swipeMain: function(items) {
		this.defocus().deover();
		this.swipeItems(items, 'main', 'mainNext', 'mainPrev', 'switch');
	},
	
	navigate: function(panel) {
		this.defocus().deover();
		this.swipeItems(getItems(10), 'main', 'mainNext', 'mainPrev', 'switch');
	},
	
	getLeadSize: function(panel) {
		return this.isLeadsOpen ? this.options.leadSize : [200, 40];	
	},
	isLeadsOpen: false,
	toggleLeads: function(layer) {
		var options = this.options;
		this.isLeadsOpen = !this.isLeadsOpen;
		this.layout
			.refreshLayer('leads', 
				this.isLeadsOpen ? [0, -this.leadsHeight, 1, 1] : [0, -options.barHeight, 1, 1], 
				this.isLeadsOpen ? [options.margin, options.barHeight + 4 * options.margin, 0, options.margin] : [options.margin, 0, 0, 0]
			)
			.setSurfaceOpacity('leads', this.isLeadsOpen ? .95 : 0)
			.refreshLayer('over', 
				this.isLeadsOpen ? [0, options.barHeight, 1, -this.leadsHeight] : [0, options.barHeight, 1, -options.barHeight], 
			);
		this.autosuggestToggle$.set(this.isLeadsOpen ? 1 : 0, this.layout.options.transition);	
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

function trialRank(trial) {
	 //?many importants, info
	 var imp = null,//trial.find(t => t.tile.flags.important),
			 supp = null;//trial.find(t => t.tile.flags.support);
			
	 return	 getAreaRank(trial) * .6 + 
					 getRightRank(imp) * .15 + getTopRank(imp) * .05 + 
					 getRightRank(supp) * .15 + getBottomRank(supp) * .05;
}
function getAreaRank(trial) {
	return trial.length ? trial.map(t => t.width * t.height).reduce((a,b) => a + b) / trial.map(t => t.size[0] * t.size[1]).reduce((a,b) => a + b) : 1;
}
function getRightRank(imp) {
	return 1;
	return imp ? imp.fit.x / (trial.map(t => t.fit.x).reduce((a,b) => Math.max(a, b)) || 1) : 1;
}
function getTopRank(imp) {
	return 1;
	return imp ? 1 - imp.fit.y / (trial.map(t => t.fit.y).reduce((a,b) => Math.max(a, b)) || 1) : 1;
}
function getBottomRank(imp) {
	return 1;
	return imp ? imp.fit.y / (trial.map(t => t.fit.y).reduce((a,b) => Math.max(a, b)) || 1) : 1;
}

function sizer(item) {
	return [400, 500].map(c => round(c, this.options.decrement));
}

function round(val, inc) {
	return Math.round(val / inc) * inc;
}

function trialResize(trial) {
	var rs = trial.map(itemResize.bind(this)).filter(r => r);
	
	if(!rs.length) return;
	
	var r = rs.reduce((a, b) => a.p < b.p ? a : b),
			t = r.t;
			
	t.width = r.w;
	t.height = r.h;
	t.pressure = r.p;
	
	return t;
}

function itemResize(t) {
	var dec = this.options.decrement,
			min = this.options.minSize,
			r = t.ratio,
			w, h;
	
	if(t.width == min[0] && t.height == min[1]) return;
			
	if(r > 1) {
		w = t.width - dec;
		h = round(w / r, dec);
	} else {
		h = t.height - dec;
		w = round(h * r, dec);
	}
	
	w = Math.max(w, min[0]);
	h = Math.max(h, min[1]);
	
	return {t, w, h, p: t.area / w / h};
}

//---

var colors = ["#311b92", "#673ab7", "#1b5e20", "#c2185b", "#673ab7", "#673ab7", "#388e3c", "#9e9d24", "#e65100"];
function getItems(count) {
	return Array(1 + random(count - 1)).fill().map((_, i) => new Surface({classes: ['panel'], properties: {background: colors[i % colors.length]}, content: i}))
}
