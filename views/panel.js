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
		this.header = new Surface({classes: ['header'], size: [undefined, true], origin: this.loaderAlign$, content: this.record.query || this.topic.item});
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
	
	pass($type, $retype, recover, pattern) {
		pattern.$type = $type;
		if($retype) pattern.$retype = $retype;
		pattern.recover = recover;
		pattern.id = this.record.id;
		this.emit('pass', pattern);
	},
	
	recover(pattern) {
		this[pattern.recover](pattern);
	},
	
	init() {
		this.getMore();
		
		var Viewer = plugins.getViewer(this.record.meta.viewer);
		
		if(Viewer) this.setViewer(Viewer);
		else this.getItems();
	},
	
	getMore() {
		this.pass('panelData', 'head', 'setMore', {flags: {exact: true}, query: `*view ${this.topic.item} ${this.record.query}`});
	},
	
	setMore(pattern) {
		if(pattern.text == 'true') 
			this.moreOpacity$.set(1, this.options.transition);
	},
	
	getItems() {
		this.pass('panelData', 'get', 'setItems', {query: `-*view ${this.topic.item} ${this.record.query}`});
	},
	
	setItems(pattern) {
		this.records = CtxParse.text(pattern.text);

		if(this.viewer) this.update();
		else this.setViewer(plugins.sniffViewers(this.records));
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
	
	requestLayout() {
		this.stopLoader();
		this.emit('requestLayout');
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