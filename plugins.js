var Viewers = [];

Viewers.sniff = function(lines, text) {
	return Viewers.map(v => ({v, r: v.sniff(lines, text)})).reduce((a, b) => a.r > b.r ? a : b).v;
}

function SmallViewer(panel) {this.panel = panel;}
SmallViewer.type = "small";
SmallViewer.prototype.desired = function() { return this.panel.flags.main ? [2, 2] : [0, 0]};

var Themes = [];

