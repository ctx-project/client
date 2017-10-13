var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		Stream = Samsara.Streams.Stream,
		TouchInput = Samsara.Inputs.TouchInput;

export default View.extend({
	defaults: {
		origin: [.5, 0],
		topicClasses: ['topic'],
	},
	
	initialize: function(opts) {
		this.add(s);		
	}
});
