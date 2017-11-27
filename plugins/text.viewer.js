export default function Viewer(panel) {
};

Viewer.key = 'text';
Viewer.type = 'contain';
Viewer.populate = true;

var serializeText = CtxCompose.getTextSerializer({tag: ['<t>', '</t>'], id: false}, '<br>');

Viewer.sniff = function() {
	return .2;
}

Viewer.prototype.desired = function() {
	return this.records ? [
		this.records.map(r => r.item.length).reduce((a,b) => a + b) / this.records.length * 10,
		(this.records.length + 3) * 20
	] : null;
}

Viewer.prototype.update = function() {
	this.panel.content.setContent(
		`<div style="overflow:auto;line-height: 1.4em; height:100%;">${serializeText(this.panel.records)}</div>`
	);
	
	this.panel.requestLayout();
}




