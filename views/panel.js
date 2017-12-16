import * as plugins from '../app/plugins.js'

var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		ContainerSurface = Samsara.DOM.ContainerSurface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		Stream = Samsara.Streams.Stream,
		TouchInput = Samsara.Inputs.TouchInput;

export default View.extend({
	defaults: {
		transition: {curve: 'easeInCubic', duration: 270 },
	},
	
	initialize(options) {
		this.record = options.record;
		this.topic = options.topic;
		
		this.loaderPulse$ = new Transitionable(1);
		this.loaderSize$ = new Transitionable([true, true]);
		this.loaderAlign$ = new Transitionable([.5, .5]);
		
		this.container = new ContainerSurface();
		this.header = new Surface({classes: ['header'], size: [undefined, true], origin: this.loaderAlign$, content: this.record.query || this.topic});
		this.content = new Surface({classes: ['content']});
		this.contentMargins$ = new Transitionable([0, 0]);
		
		this.add(this.container);
		this.container.add({align: [0, 1], origin: [0, 1], margins: this.contentMargins$}).add(this.content);
		this.container.add({
			size: this.loaderSize$,
			align: this.loaderAlign$,
		  transform: this.loaderPulse$.map(v => Transform.scale([v, v, 1]))
		 }).add(this.header);

		this.loaderPulse$.loop([
			[1.3, {curve : 'easeInCubic', duration : 500}], 
			[1, {curve : 'spring', period : 250, damping : 0.5}] 
		]);
	},
	
	pass(pattern) {
		this.emit('pass', pattern);
	},
	
	requestLayout() {
		this._stopLoader();
		this.emit('requestLayout');
	},
	
	_stopLoader() {
		if(!this.loaderPulse$) return;

		this.loaderPulse$.halt();
		this.loaderPulse$.set(1, this.options.transition);
		this.loaderSize$.set([undefined, undefined], this.options.transition);
		this.loaderAlign$.set([0, 0], this.options.transition);
		this.loaderPulse$ = null;
	},
	
	init() {
		var Viewer = plugins.getViewer(this.record.meta['*viewer']);
		if(Viewer) this._setViewer(Viewer);
		else this._getItems();
	},
	
	_getItems() {
		this.pass({$type: 'get', id: this.record.id, query: `${this.topic} ${this.record.query}`});
	},
	
	setItems(text) {
		this.records = CtxParse.text(text);
		
		if(this.viewer) this._update();
		else this._setViewer(plugins.sniffViewers(this.records));
	},
	
	_setViewer(Viewer) {
		setTimeout(() => {
			this.type = Viewer.type || 'contain';
	
			this.container.setClasses(['panel', 'shadow', this.type, Viewer.key]);
			this.contentMargins$.set(this.type == 'contain' ? [0, 37.5] : [0, 0]);
			
			this.viewer = new Viewer(this);
			this.viewer.panel = this;
			
			if(Viewer.empty) 
				this.requestLayout();
			else if(Viewer.populate) {
				if(this.records) this._update();
				else this._getItems();
			}
		});	
	},
	
	_update: function() {
		this.viewer.update();
	},
	
	desired() {
		var viewer = this.viewer,
				desired = (viewer && viewer.desired ? viewer.desired() : null) || 
									this._getMetaDesired() ||
									[200, 200];
				
		if(this.type == 'contain') desired[1] = desired[1] + 75;
		desired[0] = Math.max(desired[0], this.record.query.length * 25);
		
		return desired;
	},
	
	_getMetaDesired() {
		var width = +this.record.meta['*width'],
				height = +this.record.meta['*height'];
				
		return width && height ? [width, height] : null;		
	}
});