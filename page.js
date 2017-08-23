var Page = {
	init: function() {
		Var.study.page = {
			study: Var.study,
			static: {
				type: 'static',
				panels: [],
				node: Var.study.node.add({
					margins: [Const.margin, 2 * Const.barHeight], 
					origin: [1, .5], 
					align: [1, .5],
				})
			},
			temp: {
				type: 'temp',
				panels: [],
				node: Var.study.node.add({
					margins: [Const.margin, 2 * Const.barHeight], 
					origin: [1, .5], 
					align: [1, .5],
				})
			},
			links: {
				type: 'links',
				panels: [],
			}
		};
		Var.study.page.static.page = Var.study.page;
		Var.study.page.temp.page = Var.study.page;
		Var.study.page.links.page = Var.study.page;
		
		var conn = new CtxConnection(window.location.href, 'andrei');
		
		conn.sub().get('*View.1', text => {
			text.split('\n')
					.map(line => ({
						line: line, 
						id: line.match(/~(\d{4,})\s*$/i)[1],
						query: line.split(' ').filter(w => w[0] != '*' && w[0] != '~').join(' '), 
						ctxKey: (line.match(/(?:^|\s+)(\*ctx:\d{4,})(?:$|\s+)/i) || [null, 0])[1], 
						ctxId: +(line.match(/(?:^|\s+)\*ctx:(\d{4,})(?:$|\s+)/i) || [null, 0])[1],
						flags: { 
							main: line.indexOf('*main') != -1 ? 1 : 0,
							ooc: line.indexOf('*ooc') != -1 ? 1 : 0,
							important: line.indexOf("Important") != -1 ? 1 : 0,
							support: line.indexOf("Info") != -1 ? 1 : 0,
							small: +(line.match(/(?:^|\s+)\*small:(\d{1})/i) || [null, null])[1]
						},
					}))
					.sort((a, b) => a.id - b.id)
					.forEach((p, i, panels) => {
						panels[`*ctx:${p.id}`] = p;
						p.parent = p.ctxId ? panels[p.ctxKey] : null;
						p.group = p.parent ? p.parent.group : p;
						if(!p.parent) 
							p.groupIndex = panels
							 .filter(pi => !pi.parent && pi.flags.important == p.flags.important && pi.flags.support == p.flags.support && pi.flags.ooc == p.flags.ooc)
							 .indexOf(p);
						var ctx = (p.parent ? p.parent.ctx : conn).sub(p.query);
						p.ctx = ctx;
						ctx.panel = p;
						ctx.get('', addPanel);
					});
		});
		
		function addPanel(text, ctx) {
			ctx.panel.text = text;
			Panel.add(Var.study.page.static, ctx.panel);
			// Panel.add(Var.study.page.temp, ctx, text);
		}
		
		this._layouts.static = Layout.area.bind(Layout);
		this._layouts.links = Layout.horizontal.bind(Layout);
		this._layouts.temp = Layout.center.bind(Layout);
	},
	
	unitSize: function(size) {
		return size / 75;
	},
	
	containerWidth: function() {
		return window.innerWidth - Const.margin;
	},
	
	containerHeight: function() {
		return window.innerHeight - 2 * Const.barHeight;
	},
	
	containerUnitWidth: function() {
		return this.unitSize(this.containerWidth());
	},
	
	containerUnitHeight: function() {
		return this.unitSize(this.containerHeight());
	},
	
	_layouts: new Map(),
	layout: function(container) {
		var lo = this._layouts.get(container);
		if(!lo) {
			lo = Helper.debounce(function() {
				var width = this.containerUnitWidth(),
						height = this.containerUnitHeight(),
						fit = this._layouts[container.type](container.panels, width, height, 2, 2);
		
				if(!fit) return;
		
				fit.forEach(t => Panel.move(t.tile, {
					proportions: [t.width / width, t.height / height], 
					align: [t.fit.x / width, t.fit.y / height]
					}));
			}.bind(this), 100);

			this._layouts.set(container, lo);
		}
		
		lo();
	},
	
	backdrop: function(page, toggle) {
		var styler = page.study.styler;
		page.static.panels.forEach(p => styler.backdrop(p, toggle));
	}
}

