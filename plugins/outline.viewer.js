(function() {
	Viewer.name = 'outline';
	Viewer.type = 'contain';
	
	Viewer.sniff = function(items) {
		return .5;
	}
	
	function Viewer(panel) {
		this.items = panel.items.map(t => t.replace(/\s*~\d*\s*$/, ''));
		panel.content.innerHTML = `<li>${this.items.join('</li><li>')}</li>`;
	}	
	
	Viewer.prototype.desired = function() {
		return [
			this.items.map(l => l.length).reduce((a,b) => a + b) / this.items.length / 7,
			this.items.length / 3 + 1
		];
	}
	
	Viewer.prototype.resize = function(size) {
	}
	
	Viewer.prototype.update = function(text) {
		
	}
	
	Viewers.push(Viewer);
	
})();



