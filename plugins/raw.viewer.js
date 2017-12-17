export default function Viewer(panel) {
};

Viewer.key = 'raw';
Viewer.type = 'contain';
Viewer.populate = true;
Viewer.hidden = true;

var serializeText = CtxCompose.getTextSerializer({tag: ['<t>', '</t>'], id: ['<i>', '</i>']}, '\n');

Viewer.sniff = function() {
	return .1;
}

Viewer.prototype.desired = function() {
	var records = this.panel.records;
	return records ? [
		records.map(r => r.item.length).reduce((a,b) => a + b) / records.length * 8,
		(records.length + 1) * 20
	] : null;
}

Viewer.prototype.update = function() {
	this.panel.content.setContent(
		`<pre style="line-height:1.4em;margin:0;overflow:auto;height:100%;">${serializeText(this.panel.records)}</pre>`
	);
	
	this.panel.requestLayout();
}




