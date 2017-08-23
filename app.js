var Var = {},
		Context = Samsara.DOM.Context,
		Surface = Samsara.DOM.Surface,
		ContainerSurface = Samsara.DOM.ContainerSurface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		MouseInput = Samsara.Inputs.MouseInput,
		TouchInput = Samsara.Inputs.TouchInput,
		GenericInput = Samsara.Inputs.GenericInput,
		Accumulator = Samsara.Streams.Accumulator,
		Differential = Samsara.Streams.Differential;


var App = {
	init: function() {
		GenericInput.register({
			 mouse : MouseInput,
			 touch : TouchInput,
		});
		
		Var.context = new Context();
		Var.context.mount(document.body);
	}
}