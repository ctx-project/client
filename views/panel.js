var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		ContainerSurface = Samsara.DOM.ContainerSurface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		Stream = Samsara.Streams.Stream,
		TouchInput = Samsara.Inputs.TouchInput;

export default View.extend({
	initialize: function(options) {
		this.record = options.record;
		
		var container = new ContainerSurface({classes: ['panel', 'shadow']}),
				header = new Surface({classes: ['header'], size: [undefined, true], content: this.record.query}),
				content = new Surface({classes: ['content']});
		
		this.add(container);
		container.add({margins: [0, 37.5], align: [0, 1], origin: [0, 1]}).add(content);
		container.add(header);
	}
});
