(function() {
	Viewer.key = 'raw';
	Viewer.class = 'contain';
	
	Viewer.sniff = function() {
		return .1;
	}
	
	function Viewer(dom, lines, text) {
		this.lines = lines;
		dom.innerHTML = `<pre style="line-height:1.4em;margin:0;overflow:auto;height:100%;">${text}</pre>`;
	}	
	
	Viewer.prototype.desired = function() {
		return [
			this.lines.map(l => l.length).reduce((a,b) => a + b) / this.lines.length / 10,
			this.lines.length / 4
		];
	}
	
	Viewer.prototype.resize = function(size) {
	}
	
	Viewer.prototype.update = function(text) {
		
	}
	
	viewers.push(Viewer);
	
})();



