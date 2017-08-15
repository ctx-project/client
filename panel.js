var Panel = {
	add: function(container, panel) {
		var viewerm = panel.line.match(/(?:^|\s+)\*viewer:(\w+)/i),
				cviewer = viewerm ? viewerm[1].toLowerCase() : null,
				vpadding = {contain: 1.33, cover: 0, small: 1},
				hpadding = {contain: .66, cover: 0, small: .5},
				fullQuery = panel.ctx.getQuery().toLowerCase();
		
		panel.lines = panel.small ? null : panel.text.split('\n') ;
		panel.Viewer = panel.small ? SmallViewer : cviewer ? Viewers.find(v => v.key == cviewer) : null;
		panel.Viewer = panel.Viewer || Viewers.sniff(panel.lines, panel.text);
		
		panel.proportions = new Transitionable([1, 1]);
		panel.align = new Transitionable([0, 0]);
		panel.alignDiff = new Differential();
		panel.alignAcc = new Accumulator([0,0]);
		panel.node = container.node.add({proportions: panel.proportions, align: panel.alignAcc, margins: [Const.margin, Const.margin]});
		
		panel.surface = new Surface();
		
		panel.visual = document.createElement("panel");
		panel.visual.className = panel.Viewer.type;
		panel.visual.innerHTML = `<header>${this.getTitle(panel)}</header><div></div>`;
		panel.header = panel.visual.children[0];
		panel.content = panel.visual.children[1];
		
		panel.viewer = new (panel.Viewer)(panel.content, panel.lines, panel.text);
		
		panel.desired = panel.viewer.desired();
		panel.width = Math.ceil(Math.max(panel.desired[0], panel.ctx.query.length / 5)) + hpadding[panel.Viewer.type] + Const.umargin;
		panel.height = Math.ceil(panel.desired[1]) + vpadding[panel.Viewer.type] + Const.umargin;
		
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

			 var vx = e.velocity[0],
					 vy = e.velocity[1],
					 vxa = Math.abs(vx),
					 vya = Math.abs(vy),
					 v = Math.max(vxa, vya);
					
			 if(vx * vx + vy * vy < Const.throwSpeed) return;
			
			 // if(v == vy)
			 //	 throwTo(panel, 'bottom');
			 // else if(v == -vy) 
			 //	 throwTo(panel, 'top');
			 // else if(v == vx)
			 //	 throwTo(panel, 'right');
			 // else 
			 //	 throwTo(panel, 'left');
		});

		panel.alignAcc.subscribe(panel.handle.pluck('delta').map(d => [d[0]/Page.containerWidth(), d[1]/Page.containerHeight()]));
		panel.alignDiff.subscribe(panel.align);
		panel.alignAcc.subscribe(panel.alignDiff);
		
		panel.container = container;
		panel.surface.setContent(panel.visual);
		panel.node.add(panel.surface);
		container.panels.push(panel);
		Var.study.styler.apply(panel);

		Page.layout(container);
	},
	
	getTitle: function(panel) {
		var p = panel.ctx.getPath();
		if(p.length > 1 && !panel.group.flags.ooc) p.shift();
		return p.join(' ');
	},
	
	layout: function(trial, width, height) {
		trial.tile.proportions.set([trial.width / width, trial.height / height], Const.curve);
		trial.tile.align.reset(trial.tile.alignAcc.get());
		trial.tile.align.set([trial.fit.x / width, trial.fit.y / height], Const.curve);
	}
}

