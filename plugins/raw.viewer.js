(function() {
	Viewer.key = 'raw';
	Viewer.type = 'contain';
	
	Viewer.sniff = function() {
		return .1;
	}
	
	function Viewer(panel) {
		this.items = panel.items;
		panel.content.innerHTML = `<pre style="line-height:1.4em;margin:0;overflow:auto;height:100%;">${panel.text}</pre>`;
	}	
	
	Viewer.prototype.desired = function() {
		return [
			this.items.map(l => l.length).reduce((a,b) => a + b) / this.items.length / 10,
			this.items.length / 4
		];
	}
	
	Viewer.prototype.resize = function(size) {
	}
	
	Viewer.prototype.update = function(text) {
		
	}
	
	Viewers.push(Viewer);
	
})();



