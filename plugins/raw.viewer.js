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
	return this.records ? [
		this.records.map(r => r.item.length).reduce((a,b) => a + b) / this.records.length * 10,
		(this.records.length + 3) * 20
	] : null;
}

Viewer.prototype.update = function() {
	this.records = this.panel.records;
	
	this.panel.content.setContent(
		`<pre style="line-height:1.4em;margin:0;overflow:auto;height:100%;">${this.records.map(r => r.tokens.map(t => t.type == 'tag' ? `<t>${t.body}</t>` : t.body).join(' ') + ' ' + `<i>~${r.id}</i>`).join('\n')}</pre>`
	);
	
	this.panel.requestLayout();
}




