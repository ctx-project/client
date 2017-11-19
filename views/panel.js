import * as plugins from '../app/plugins.js'

var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		ContainerSurface = Samsara.DOM.ContainerSurface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		Stream = Samsara.Streams.Stream,
		TouchInput = Samsara.Inputs.TouchInput;

export default View.extend({
	initialize(options) {
		this.record = options.record;
	},
	
	pass(pattern) {
		this.emit('pass', pattern);
	},
	
	init() {
		this.pass({$type: 'sub', id: this.record.id, query: this.record.query}); //, parent: 'topic'
		
		var Viewer = plugins.getViewer(this.record.meta['*viewer']);
		if(Viewer) this._setViewer(Viewer);
		else this._getItems();
	},
	
	_getItems() {
		this.pass({$type: 'get', id: this.record.id});
	},
	
	setItems(text) {
		this.records = CtxParse.text(text);
		
		if(this.viewer) this.viewer.update();
		else this._setViewer(plugins.sniffViewers(this.records));
	},
	
	_setViewer(Viewer) {
		this.container = new ContainerSurface({classes: ['panel', 'shadow', Viewer.type || 'contain', Viewer.key]});
		this.header = new Surface({classes: ['header'], size: [undefined, true], content: this.record.query});
		this.content = new Surface({classes: ['content']});
		
		this.add(this.container);
		this.container.add({margins: [0, 37.5], align: [0, 1], origin: [0, 1]}).add(this.content);
		this.container.add(this.header);
		
		this.viewer = new Viewer(this);
		this.viewer.panel = this;
		if(Viewer.populate) {
			if(this.records) this.viewer.update();
			else this._getItems();
		}
	}
});

// plugins.sniffViewers(this.records)