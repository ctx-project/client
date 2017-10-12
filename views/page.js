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
		minimised: true
	},
	
	initialize: function(opt) {
		var container = new ContainerSurface({
					origin: [0, 1],
					properties: {
						background: 'white'
					}
				});
		
		this.translate = new Transitionable(0);
		this.opacity = new Transitionable(1);
		
		this.add({
			 transform: this.translate.map(t => Transform.translate([0, 2.5 * t, -4 * t])),
			 align: [0, 1],
			 opacity: this.opacity,
		}).add(container);
		
		container.add({align: [.1, .1]}).add(new Surface({
			properties : {background : 'blue'},
			proportions: [.3, .3],
		}));
		
		container.add({align: [.9, .9]}).add(new Surface({
			properties : {background : 'green'},
			proportions: [.3, .3],
			origin: [1, 1],
		}));
		
		
		this.minimised = false;
		var handle = new TouchInput();
		handle.subscribe(container);
		handle.on('end', this.toggle.bind(this));
		
		if(opt.minimised) this.toggle();
	},
	
	toggle: function() {
		this.translate.set(this.minimised ? 0 : 300, this.options.transition);
		this.opacity.set(this.minimised ? 1 : .5, this.options.transition);
		this.minimised = !this.minimised;
	}
});













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

