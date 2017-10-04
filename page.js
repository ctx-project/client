var Var = {},
		Context = Samsara.DOM.Context,
		Surface = Samsara.DOM.Surface,
		ContainerSurface = Samsara.DOM.ContainerSurface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		MouseInput = Samsara.Inputs.MouseInput,
		TouchInput = Samsara.Inputs.TouchInput,
		GenericInput = Samsara.Inputs.GenericInput,
		Accumulator = Samsara.Streams.Accumulator,
		Differential = Samsara.Streams.Differential;

GenericInput.register({
	 mouse : MouseInput,
	 touch : TouchInput,
});

var Page = {
	init: function() {
		Var.context = new Context();
		Var.context.mount(document.body);
		
		Var.container = Var.context.add({});
		Var.frame = Var.container.add({
			margins: [Const.margin, 2 * Const.barHeight], 
			origin: [1, .5], 
			align: [1, .5],
		});
		
		Var.static = {
			type: 'static', 
			panels: [], 
			fit: Fit.area.bind(Fit),
			setSize: panel => Fit.setPanelSize(panel, Const.umargin)
		};
		Var.over = {
			type: 'over', 
			panels: [], 
			fit: Fit.center.bind(Fit),
			setSize: panel => Fit.setPanelSize(panel, 0)
		};
		Var.links = {
			type: 'links', 
			panels: [], 
			fit: Fit.horizontal.bind(Fit),
			setSize: panel => Fit.setLinkSize(panel)
		};

		window.onresize = () => { 
			Page.layout(Var.static);
			Page.layout(Var.over);
		}
		
		Var.theme = new Themes[0];
		
		Var.conn = new CtxConnection(window.location.href, 'andrei');
		
		this.fetchTopic('*View.1');
	},
	
	fetchTopic: function(phrase) {
		Var.conn.sub().get(phrase, text => {
			text.split('\n')
					.map(Panel.create)
					.sort((a, b) => a.id - b.id)
					.forEach((p, i, panels) => {
						Panel.prepare(p, panels).ctx.get('', addPanel);
					});
		});
		
		function addPanel(text, ctx) {
			ctx.panel.text = text;
			Panel.add(ctx.panel, Var.static);
		}
	},
	
	unitSize: function(size) {
		return size / 75;
	},
	
	frameWidth: function() {
		return window.innerWidth - Const.margin;
	},
	
	frameHeight: function() {
		return window.innerHeight - 2 * Const.barHeight;
	},
	
	frameUnitWidth: function() {
		return this.unitSize(this.frameWidth());
	},
	
	frameUnitHeight: function() {
		return this.unitSize(this.frameHeight());
	},
	
	_layouts: new Map(),
	layout: function(layer) {
		var lo = this._layouts.get(layer);
		if(!lo) {
			lo = Helper.debounce(function() {
				var width = this.frameUnitWidth(),
						height = this.frameUnitHeight(),
						fit = layer.fit(layer.panels, width, height, 2, 2);
		
				if(!fit) return;
		
				fit.forEach(t => Panel.move(t.tile, {
					proportions: [t.width / width, t.height / height], 
					align: [t.fit.x / width, t.fit.y / height]
					}));
			}.bind(this), 100);

			this._layouts.set(layer, lo);
		}
		
		lo();
	},
	
	backdrop: function(toggle) {
		Var.static.panels.forEach(p => Var.theme.backdrop(p, toggle));
	}
}

