import * as H from './helper.js'

var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		ContainerSurface = Samsara.DOM.ContainerSurface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		Stream = Samsara.Streams.Stream,
		TouchInput = Samsara.Inputs.TouchInput;

export default View.extend({
	defaults: {
		origin: [.5, 0],
		classes: ['autosuggest', 'shadow'],
		placeholder: 'Search ...',
		transition: {curve : 'easeInCubic', duration: 270 },
		width: 200, 
		inputHeight: 50, 
		contentHeight: 200
	},
	
	initialize: function(options) {
		this.setSize([this.options.width, true]);
		
		this.height$ = new Transitionable(options.inputHeight);
		
		this.container = new ContainerSurface({
			size: this.height$.map(h => [undefined, h]),
			classes: options.classes,
			properties: {
				zIndex: options.zIndex,
				'overflow': 'hidden',
			},
		});
		
		var containerInput = new TouchInput();
		containerInput.subscribe(this.container);
		containerInput.on('end', e => {
			if(H.enhanceEvent(e).orientation != 'bottom') return;
			this.clear();
			this.close();		
		});
		
		var input = new Surface({
			tagName: 'input',
			size: [undefined, options.inputHeight],
			attributes: {
				placeholder: options.placeholder,
			},
		});
		
		//?hack: to get the value
		input.size.once('start', () => {
			this.inputElement = input._currentTarget;
		});
		
		input.on('input', () => {
			var v = this.inputElement.value,
					l = v.length;
			if(l && !this.isOpen) this.open();
 			else if(!l && this.isOpen) this.close();
 			else this.emit('update', v);
		});
		
		input.on('keydown', e => {
			switch(e.key) {
				case 'Enter': this.close(); break;
				case 'ArrowDown': this.select(+1); e.preventDefault(); break;
				case 'ArrowUp': this.select(-1); e.preventDefault(); break;
			} 
		})
		
		this.content = new Surface({
			classes: ['content'],
			properties: {
				'margin-top': `${options.inputHeight}px`,
			},
		});
		
		this.container.add(this.content);		
		this.container.add(input);		
		this.add(this.container);
	},
	
	open: function() {
		this.height$.set(this.options.contentHeight + this.options.inputHeight, this.options.transition);
		this.container.addClass('open');
		this.isOpen = true;
		this.emit('start');
	},
		
	setResults: function(items) {
		this.items = items;
		this.drawResults();
	},
	
	drawResults: function(selected = 0) {
		this.selected = selected;
		var value = this.inputElement.value.trim();
		this.content.setContent(this.items.map((item, ix) => itemTpl(item, value, ix == selected)).join(''));
	},
	
	select: function(delta) {
		var selected = this.selected + delta;
		if(selected >= 0 && selected < this.items.length)
			this.drawResults(selected);
	},
	
	clear: function() {
		this.inputElement.value = '';
	},
	
	close: function() {
		this.height$.set(this.options.inputHeight, this.options.transition);
		this.container.removeClass('open');
		this.isOpen = false;
		this.emit('end', this.inputElement.value ? this.items[this.selected] : null);
		
		setTimeout(() => this.setResults([]), this.options.transition.duration);
	},

});

function itemTpl(item, value, selected) {
	return `<div class="item ${selected ? 'selected' : ''}">${item.replace(RegExp(value, 'ig'), `<span>${value}</span>`)}</div>`;
};
