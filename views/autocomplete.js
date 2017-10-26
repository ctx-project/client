var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		Stream = Samsara.Streams.Stream,
		TouchInput = Samsara.Inputs.TouchInput;

export default View.extend({
	defaults: {
		origin: [.5, 0],
		setup: {}
	},
	
	initialize: function(opts) {
		this.add(new Surface({
			tagName: 'input',
			classes: opts.setup.classes || ['input-bar', 'shadow'],
			attributes: {
				placeholder: opts.setup.placeholder || 'Search topic ...'
			},
			properties: {
				zIndex: opts.setup.zIndex
			}
		}));		
	}
});
