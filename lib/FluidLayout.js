import {debounce} from './helper.js'

var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		Stream = Samsara.Streams.Stream,
		TouchInput = Samsara.Inputs.TouchInput;


export default View.extend({
	defaults: {
		items: [],
		layers: {},
		transition: {curve : 'easeInCubic', duration: 150 }
	},
	
	initialize: function(opts) {
		this.items = opts.items;
		this.layers = opts.layers;

		var created = false;
		this.size.on('start', () => {
			if(created) return;
			created = true;
			
			var size = this.getSize();
			Object.values(this.layers).forEach(layer => {
				layer.corners = layer.corners || [0, 0, 1, 1];
				layer.margin = layer.margin || [0, 0];
				layer.baseZ = layer.baseZ || 0;
				layer.handleZ = layer.handleZ || 1;
				
				var c = setLayerState(layer, size);
				
				if(!layer.surface) return;
				
				layer.position$ = new Transitionable([c[0], c[1], 0]),
				layer.size$ = new Transitionable(layer.size);
				this.add({
							transform: layer.position$.map(p => Transform.translate([p[0], p[1], 0])), 
							size: layer.size$ })
						.add(new Surface(layer.surface));
			});
			
			this.items.forEach(item => {
				// this.add(item);
			});
		});
		
		this.size.on('update', debounce(function() {
			var size = this.getSize();
			Object.values(this.layers).forEach(layer => {
				var c = setLayerState(layer, size);
				layer.position$.set([c[0], c[1], 0], this.options.transition);
				layer.size$.set(layer.size, this.options.transition);
			});
		}.bind(this), 300));
	},
});

	
function getAbsCorners(corners, size) {
	return [
		getAbsCornerCoordinate(corners[0], size[0]),
		getAbsCornerCoordinate(corners[1], size[1]),
		getAbsCornerCoordinate(corners[2], size[0]),
		getAbsCornerCoordinate(corners[3], size[1])
	];	
}

function getAbsCornerCoordinate(coord, length) {
	var pos = coord >= 0,
			abs = Math.abs(coord) > 1;

	return 	pos ? (abs ? coord : coord * length) :
					(abs ? coord + length : (1 + coord) * length);
}

function setLayerState(layer, size){
	var c = layer.absCorners = getAbsCorners(layer.corners, size);
					layer.size = [c[2] - c[0], c[3] - c[1]];
	return c;				
}


