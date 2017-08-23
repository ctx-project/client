var Panel = {
	add: function(container, panel) {
		var viewerm = panel.line.match(/(?:^|\s+)\*viewer:(\w+)/i),
				cviewer = viewerm ? viewerm[1].toLowerCase() : null,
				fullQuery = panel.ctx.getQuery().toLowerCase();
		
		panel.lines = panel.flags.small ? null : panel.text.split('\n') ;
		panel.Viewer = panel.flags.small ? SmallViewer : cviewer ? Viewers.find(v => v.key == cviewer) : null;
		panel.Viewer = panel.Viewer || Viewers.sniff(panel.lines, panel.text);
		
		panel.proportions = new Transitionable([1, 1]);
		panel.align = new Transitionable([0, 0]);
		panel.alignDiff = new Differential();
		panel.alignAcc = new Accumulator([0,0]);
		panel.node = container.node.add({proportions: panel.proportions, align: panel.alignAcc, margins: [Const.margin, Const.margin]});
		
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

		panel.alignAcc.subscribe(panel.handle.pluck('delta').map(d => [d[0]/Page.containerWidth(), d[1]/Page.containerHeight()]));
		panel.alignDiff.subscribe(panel.align);
		panel.alignAcc.subscribe(panel.alignDiff);
		
		panel.surface.setContent(panel.visual);
		panel.node.add(panel.surface);
		panel.last = {};
		panel.container = container;
		container.panels.push(panel);
		Var.study.styler.apply(panel);
		Panel.setSize(panel);
		Page.layout(container);
	},
	
	getTitle: function(panel) {
		var p = panel.ctx.getPath();
		if(p.length > 1 && !panel.group.flags.ooc) p.shift();
		return p.join(' ');
	},
	
	move: function(panel, pos) {
		panel.proportions.set(pos.proportions, Const.curve);
		panel.align.reset(panel.alignAcc.get());
		panel.align.set(pos.align, Const.curve);
		panel.last[panel.container.type] = pos;
	},
	
	return: function(panel) {
		Panel.move(panel, panel.last[panel.container.type]);
	},
	
	changeContainer: function(panel, type) {
		var container = panel.container;
		
		container.panels.splice(container.panels.indexOf(panel), 1);
		panel.container = null;
		
		if(!type) return;
		
		container = container.page[type];
		panel.container = container;
		container.panels.push(panel);
	},
	
	setSize: function(panel) {
		if(panel.container.type == 'static') _setSize(Const.umargin);
		
		else if(panel.container.type == 'temp') _setSize(0);
		
		else if(panel.container.type == 'links') {
			panel.width = Math.ceil(panel.ctx.query.length / 5) + Const.umargin;
			panel.height = 1 + Const.umargin;
		}
		
		function _setSize(margin) {
			panel.desired = panel.viewer.desired();
			panel.width = Math.ceil(Math.max(panel.desired[0], panel.ctx.query.length / 5)) + Const.hpadding[panel.Viewer.type] + margin;
			panel.height = Math.ceil(panel.desired[1]) + Const.vpadding[panel.Viewer.type] + margin;
		}
	},

	
}

