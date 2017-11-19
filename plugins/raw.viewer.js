export default function Viewer(panel) {
};

Viewer.key = 'raw';
Viewer.type = 'contain';
Viewer.populate = true;
Viewer.hidden = true;

Viewer.sniff = function() {
	return .1;
}

Viewer.prototype.desired = function() {
	return [300, 400];
	// return [
	// 	this.items.map(l => l.length).reduce((a,b) => a + b) / this.items.length / 10,
	// 	this.items.length / 4
	// ];
}

Viewer.prototype.update = function() {
	this.panel.content.setContent(
		`<pre style="line-height:1.4em;margin:0;overflow:auto;height:100%;">${this.panel.records.map(r => r.tokens.map()).join('\n')}</pre>`
	);
}




