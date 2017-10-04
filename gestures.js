var Gestures = {
	screen: function(panel, e) {
		var vx = e.velocity[0],
			vy = e.velocity[1],
			vxa = Math.abs(vx),
			vya = Math.abs(vy),
			v = Math.max(vxa, vya),
			isThrow = vx * vx + vy * vy > Const.throwSpeed,
			cumulate = e.cumulate,
			distance = Math.pow(cumulate[0], 2) + Math.pow(cumulate[1], 2),
			isTap = distance < Const.tapDistance,
			type = panel.layer.type,
			other = Var.over.panels[0];
		
		if(other && other != panel) this.minimize(other);

		if(type == 'links') {
			if(isTap)
				this.incorporate(panel, 'over')
			else if(v == -vy)
				if(isThrow) this.maximize(panel); else this.incorporate(panel, 'static');
			else
				Panel.return(panel);
				
			return;	
		}	
			
		if(isTap)	
			if(type == 'static') ; else this.incorporate(panel, 'static');
		else if(v == vy)
			if(isThrow) this.minimize(panel); else this.revealTop(panel);
		else if(v == -vy) 
			if(isThrow) this.maximize(panel); else this.revealBottom(panel);
		else if(v == vx)
			if(isThrow) this.stikyfy(panel); else this.revealLeft(panel);
		else 
			if(isThrow) this.share(panel); else	this.revealRight(panel);
	},
	
	changeLayer: function(panel, type) {
		var oldLayer = panel.layer;
		Panel.changeLayer(panel, type);
		Page.layout(oldLayer);
		Panel.setSize(panel);
		Page.layout(panel.layer);
	},
	
	minimize: function(panel) {
		if(panel.flags.main) {
			Panel.return(panel);
			return;
		}
		
		if(panel.layer.type == 'over') 
			Page.backdrop(false);
		panel.flags.link = true;
		panel.visual.classList.add('link');
		this.changeLayer(panel, 'links');
	},
	
	incorporate: function(panel, type) {
		panel.flags.link = false;
		panel.visual.classList.remove('link');
		panel.surface.setProperties({zIndex: type == 'over' ? 1 : 0});
		Page.backdrop(type == 'over');
		this.changeLayer(panel, type);
	},
	
	maximize: function(panel) {
		Panel.return(panel);
	},
	
	share: function(panel) {
		Panel.return(panel);
	},
	
	stikyfy: function(panel) {
		Panel.return(panel);
	},
	
	revealTop: function(panel) {
		Panel.return(panel);
	},
	
	revealBottom: function(panel) {
		Panel.return(panel);
	},
	
	revealLeft: function(panel) {
		Panel.return(panel);
	},
	
	revealRight: function(panel) {
		Panel.return(panel);
	},
	
	tap: function(e) {
		l(e.path[1].panel);
	}			
}

