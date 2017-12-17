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
	var records = this.panel.records;
	return records ? [
		records.map(r => r.item.length).reduce((a,b) => a + b) / records.length * 10,
		(records.length + 1) * 20
	] : null;
}

Viewer.prototype.update = function() {
	this.panel.content.setContent(
		`<div style="overflow:auto;line-height: 1.4em; height:100%;">${serializeText(this.panel.records)}</div>`
	);
	
	this.panel.requestLayout();
}
