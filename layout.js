var Layout = {
	area: function(tiles, width, height, minWidth, minHeight) {
		return 	this.screenArea.apply(this, arguments) || 
						this.pageArea.apply(this, arguments);
	},
	
	screenArea: function(tiles, width, height, minWidth, minHeight) {
		this.start = performance.now();
		var rank = 0, r,
				trial = this.getTrial(tiles),
				best = null;
				
		for(;;) {
			for(var i = 0; i < this.orders.length; i++) {
				var order = this.orders[i];
				if(order == this.rand) trial.forEach(t => t.rand = t.tile.flags.main ? 1 : Math.random());
				
				trial.sort(order);
				
				new Packer(width, height).fit(trial);

				if(trial.every(t => t.fit) && (r = getRank()) > rank) {
					rank = r;
					best = trial;
				}
				
				if(this.late(rank)) return best;
				else trial = this.getTrial(trial);
			}
			
			if(this.late(rank) || !scale()) return best;
		} 

		function scale() {
			var scaled = false;
			trial.forEach(t => {
				if(t.width > 4) {t.width = t.width - 1; scaled = true;}
				if(t.height > 4) {t.height = t.height - 1; scaled = true;}
			});
			return scaled;
		}

		function getRank() {
			//?many importants, info
			var imp = trial.find(t => t.tile.flags.important),
					supp = trial.find(t => t.tile.flags.support);
					
			return 	getAreaRank() * .6 + 
							getRightRank(imp) * .15 + getTopRank(imp) * .05 + 
							getRightRank(supp) * .15 + getBottomRank(supp) * .05;
		}
		function getAreaRank() {
			return trial.length ? trial.map(t => t.width * t.height).reduce((a,b) => a + b) / trial.map(t => t.tile.width * t.tile.height).reduce((a,b) => a + b) : 1;
		}
		function getRightRank(imp) {
			return imp ? imp.fit.x / (trial.map(t => t.fit.x).reduce((a,b) => Math.max(a, b)) || 1) : 1;
		}
		function getTopRank(imp) {
			return imp ? 1 - imp.fit.y / (trial.map(t => t.fit.y).reduce((a,b) => Math.max(a, b)) || 1) : 1;
		}
		function getBottomRank(imp) {
			return imp ? imp.fit.y / (trial.map(t => t.fit.y).reduce((a,b) => Math.max(a, b)) || 1) : 1;
		}
	},
	
	pageArea: function() {
		return false;
	},
	
	getTrial: function(tiles) {
		return tiles.map(tile => ({tile: tile.tile || tile, width: tile.width, height: tile.height, w: tile.width, h: tile.height}));
	},
	
	rand: (t1, t2) => t1.rand - t2.rand,
	
	orders: [
		(t1, t2) => t1.tile.flags.main ? -1 : t2.tile.flags.main ? 1 : (Math.max(t1.width, t1.height) - Math.max(t2.width, t2.height)),
		(t1, t2) => t1.tile.flags.main ? -1 : t2.tile.flags.main ? 1 : (t1.width * t1.height - t2.width * t2.height),
		(t1, t2) => t1.tile.flags.main ? -1 : t2.tile.flags.main ? 1 : (t1.width - t2.width),
		(t1, t2) => t1.tile.flags.main ? -1 : t2.tile.flags.main ? 1 : (t1.height - t2.height),
		this.rand, this.rand, this.rand, this.rand, this.rand, this.rand
	],
	
	start: performance.now(),
	late: function(rank) {
		var time = performance.now() - this.start;
		return Math.max(time * rank, time / 10) > 50;
	},
	
	horizontal: function(tiles) {
		var h = Page.containerUnitHeight(),
				x = 1 - Const.umargin;
		return tiles.map((tile) => ({
			tile: tile.tile || tile, width: tile.width, height: tile.height,
			fit: {
				x: (x = x + tile.width) - tile.width + Const.umargin,
				y: h
			}}));
	},
	
	center: function(tiles, areaWidth, areaHeight) {
		if(!tiles.length) return;
		
		var tile = tiles[0],
				width = Math.min(tile.width, areaWidth - 2),
				height = Math.min(tile.height, areaHeight - 2);
				
		return [{
			tile, width, height, 
			fit: {
				x: (areaWidth - width) / 2,
				y: (areaHeight - height) / 2,
			}
		}];
	}
}