var Panel = {
	create: function(item) {
		return {
			item: item, 
			id: item.match(/~(\d{4,})\s*$/i)[1],
			query: item.split(' ').filter(w => w[0] != '*' && w[0] != '~').join(' '), 
			ctxKey: (item.match(/(?:^|\s+)(\*ctx:\d{4,})(?:$|\s+)/i) || [null, 0])[1], 
			ctxId: +(item.match(/(?:^|\s+)\*ctx:(\d{4,})(?:$|\s+)/i) || [null, 0])[1],
			flags: { 
				main: item.indexOf('*main') != -1 ? 1 : 0,
				ooc: item.indexOf('*ooc') != -1 ? 1 : 0,
				important: item.indexOf("Important") != -1 ? 1 : 0,
				support: item.indexOf("Info") != -1 ? 1 : 0,
				small: +(item.match(/(?:^|\s+)\*small:(\d{1})/i) || [null, null])[1]
			},
		}
	},
	
	prepare: function(panel, panels) {
		panels[`*ctx:${panel.id}`] = panel;
		panel.parent = panel.ctxId ? panels[panel.ctxKey] : null;
		panel.group = panel.parent ? panel.parent.group : panel;
		if(!panel.parent) 
			panel.groupIndex = panels
			 .filter(pi => !pi.parent && pi.flags.important == panel.flags.important && pi.flags.support == panel.flags.support && pi.flags.ooc == panel.flags.ooc)
			 .indexOf(panel);
		var ctx = (panel.parent ? panel.parent.ctx : Var.conn).sub(panel.query);
		panel.ctx = ctx;
		ctx.panel = panel;
		
		return panel;
	},
	
	add: function(panel, layer) {
		var viewerm = panel.item.match(/(?:^|\s+)\*viewer:(\w+)/i),
				cviewer = viewerm ? viewerm[1].toLowerCase() : null,
				fullQuery = panel.ctx.getQuery().toLowerCase();
		
		panel.items = panel.flags.small ? null : panel.text.split('\n') ;
		panel.Viewer = panel.flags.small ? SmallViewer : cviewer ? Viewers.find(v => v.key == cviewer) : null;
		panel.Viewer = panel.Viewer || Viewers.sniff(panel.items, panel.text);
		
		panel.proportions = new Transitionable([1, 1]);
		panel.align = new Transitionable([0, 0]);
		panel.alignDiff = new Differential();
		panel.alignAcc = new Accumulator([0,0]);
		panel.node = Var.frame.add({proportions: panel.proportions, align: panel.alignAcc, margins: [Const.margin, Const.margin]});
		
		panel.surface = new Surface();
		
		panel.visual = document.createElement("panel");
		panel.visual.className = `${panel.Viewer.type} ${panel.flags.main ? 'main' : ''}`;
		panel.visual.innerHTML = `<header>${this.getTitle(panel)}</header><div></div>`;
		panel.header = panel.visual.children[0];
		panel.content = panel.visual.children[1];
		
		panel.viewer = new (panel.Viewer)(panel);
		
		panel.handled = true;
		panel.handle = new GenericInput(['mouse', 'touch']);
		panel.handle.subscribe(panel.surface);
		panel.handle.on('start', function(e){
			 if(e.event.target.tagName == 'HEADER') return;
			 panel.handled = false;
			 panel.handle.unsubscribeInput('touch');
			 panel.handle.unsubscribeInput('mouse');
		});
		panel.visual.addEventListener('touchend', () => {
			 if(panel.handled) return;
			 panel.handle.subscribeInput('touch');
			 panel.handle.subscribeInput('mouse');
		});
		panel.handle.on('end', function(e){
			if(!panel.handled) { panel.handled = true; return; }
			Gestures.screen(panel, e);	
		});

		panel.alignAcc.subscribe(panel.handle.pluck('delta').map(d => [d[0]/Page.frameWidth(), d[1]/Page.frameHeight()]));
		panel.alignDiff.subscribe(panel.align);
		panel.alignAcc.subscribe(panel.alignDiff);
		
		panel.surface.setContent(panel.visual);
		panel.node.add(panel.surface);
		panel.last = {};
		panel.layer = layer;
		layer.panels.push(panel);
		Var.theme.apply(panel);
		Panel.setSize(panel);
		Page.layout(layer);
	},
	
	getTitle: function(panel) {
		var p = panel.ctx.getPath();
		if(p.length > 1 && !panel.group.flags.ooc) p.shift();
		return p.join(' ');
	},
	
	setSize: function(panel) {
		panel.layer.setSize(panel);
	},

	move: function(panel, pos) {
		panel.proportions.set(pos.proportions, Const.curve);
		panel.align.reset(panel.alignAcc.get());main
		panel.align.set(pos.align, Const.curve);
		panel.last[panel.layer.type] = pos;
	},
	
	return: function(panel) {
		Panel.move(panel, panel.last[panel.layer.type]);
	},
	
	changeLayer: function(panel, type) {
		var layer = panel.layer;
		
		layer.panels.splice(layer.panels.indexOf(panel), 1);
		panel.layer = null;
		
		if(!type) return;
		
		layer = Var[type];
		panel.layer = layer;
		layer.panels.push(panel);
	},
}

