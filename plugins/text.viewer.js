export default function Viewer(panel) {
};

Viewer.key = 'text';
Viewer.type = 'contain';
Viewer.populate = true;

Viewer.sniff = function() {
	return .2;
}

Viewer.prototype.desired = function() {
	return this.records ? [
		this.records.map(r => r.item.length).reduce((a,b) => a + b) / this.records.length * 10,
		this.records.length * 20
	] : null;
}

Viewer.prototype.update = function() {
	this.records = this.panel.records;
	
	this.panel.content.setContent(
		`<div style="overflow:auto;line-height: 1.4em; height:100%;">${this.records.map(r => r.tokens.map(t => t.type == 'tag' ? `<t>${t.body}</t>` : t.body).join(' ')).join('<br>')}</div>`
	);
	
	this.panel.requestLayout();
}




