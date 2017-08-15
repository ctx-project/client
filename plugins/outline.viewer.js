(function() {
	Viewer.name = 'outline';
	Viewer.type = 'contain';
	
	Viewer.sniff = function(lines) {
		return .5;
	}
	
	function Viewer(dom, lines) {
		this.lines = lines.map(t => t.replace(/\s*~\d*\s*$/, ''));
		dom.innerHTML = `<li>${this.lines.join('</li><li>')}</li>`;
	}	
	
	Viewer.prototype.desired = function() {
		return [
			this.lines.map(l => l.length).reduce((a,b) => a + b) / this.lines.length / 7,
			this.lines.length / 3 + 1
		];
	}
	
	Viewer.prototype.resize = function(size) {
	}
	
	Viewer.prototype.update = function(text) {
		
	}
	
	Viewers.push(Viewer);
	
})();



