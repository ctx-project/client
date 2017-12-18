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
		this.moreOpacity$ = new Transitionable(0);
		
		this.container = new ContainerSurface();
		this.header = new Surface({classes: ['header'], size: [undefined, true], origin: this.loaderAlign$, content: this.record.query || this.topic});
		this.content = new Surface({classes: ['content']});
		this.more = new Surface({classes: ['more'], size: [true, true], origin: [1, 0], opacity: this.moreOpacity$,  content: '›'});
		this.contentMargins$ = new Transitionable([0, 0]);
		
		this.add(this.container);
		
		this.container
				.add({align: [0, 1], origin: [0, 1], margins: this.contentMargins$})
				.add(this.content);
		
		this.container
				.add({
					size: this.loaderSize$,
					align: this.loaderAlign$,
				  transform: this.loaderPulse$.map(v => Transform.scale([v, v, 1]))
				 })
				 .add(this.header);

		this.container
				.add({align: [1, 0] })
				.add(this.more);

	 this.loaderPulse$.loop([
			[1.3, {curve : 'easeInCubic', duration : 500}], 
			[1, {curve : 'spring', period : 250, damping : 0.5}] 
		]);
	},
	
	pass(pattern) {
		this.emit('pass', pattern);
	},
	
	relay(pattern) {
		this[pattern.task](CtxParse.text(pattern.text));
	},
	
	init() {
		this.getMore();
		
		var Viewer = plugins.getViewer(this.record.meta.viewer);
		
		if(Viewer) this.setViewer(Viewer);
		else this.getItems();
	},
	
	getItems() {
		this.pass({$type: 'get', id: this.record.id, task:'setItems', query: `-*view ${this.topic} ${this.record.query}`});
	},
	
	setItems(records) {
		this.records = records;

		if(this.viewer) this.update();
		else this.setViewer(plugins.sniffViewers(this.records));
	},
	
	getMore() {
		this.pass({$type: 'head', flags: {exact: true}, id: this.record.id, task:'setMore', query: `*view ${this.topic} ${this.record.query}`});
	},
	
	setMore(records) {
		if(records.length && records[0].item == 'true') 
			this.moreOpacity$.set(1, this.options.transition);
	},
	
	setViewer(Viewer) {
		setTimeout(() => {
			this.type = Viewer.type || 'contain';
	
			this.container.setClasses(['panel', 'shadow', this.type, Viewer.key]);
			this.contentMargins$.set(this.type == 'contain' ? [0, 37.5] : [0, 0]);
			
			this.viewer = new Viewer(this);
			this.viewer.panel = this;
			
			if(Viewer.empty) 
				this.requestLayout();
			else if(Viewer.populate) {
				if(this.records) this.update();
				else this.getItems();
			}
		});	
	},
	
	requestLayout() {
		this.stopLoader();
		this.emit('requestLayout');
	},
	
	stopLoader() {
		if(!this.loaderPulse$) return;

		this.loaderPulse$.halt();
		this.loaderPulse$.set(1, this.options.transition);
		this.loaderSize$.set([undefined, undefined], this.options.transition);
		this.loaderAlign$.set([0, 0], this.options.transition);
		this.loaderPulse$ = null;
	},
	
	update: function() {
		this.viewer.update();
	},
	
	desired() {
		var viewer = this.viewer,
				desired = (viewer && viewer.desired ? viewer.desired() : null) || 
									this.getMetaDesired() ||
									[200, 200];
				
		if(this.type == 'contain') desired[1] = desired[1] + 75;
		desired[0] = Math.max(desired[0], this.record.query.length * 25);
		
		return desired;
	},
	
	getMetaDesired() {
		var width = +this.record.meta.width,
				height = +this.record.meta.height;
				
		return width && height ? [width, height] : null;		
	}
});