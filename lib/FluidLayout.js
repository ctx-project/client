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
		transition: {curve : 'easeInCubic', duration: 2500 }
	},
	
	initialize: function(opts) {
		this.layers = {};
		this.attached = new WeakMap();

		var created = false;
		this.size.on('start', () => {
			if(created) return;
			created = true;
			
			Object.values(opts.layers).forEach(layer => this.refresh(this.addLayer(layer)));
		});
		
		this.size.on('update', debounce(this.refreshAll.bind(this), 300));
	},
	
	addLayer: function(layer) {
		var birth = layer.birth || {},
			_birth = {
				position: birth.position || [0, 0, 0],
				size: birth.size || [0, 0]
			},
			_layer = this.layers[layer.name] = {
				name: layer.name,
				items: [],
				defCorners: layer.corners || [0, 0, 1, 1],
				surface: layer.surface,
				margins: layer.margins || [0, 0],
				baseZ: layer.baseZ || 0,
				handleZ: layer.handleZ || 1,
				packer: layer.packer,
				birth: {
					position: [_birth.position[0] + _birth.size[0] / 2, _birth.position[1] + _birth.size[1] / 2, 0], 
					size: [0, 0]
				}
			};
		
		if(layer.surface) {
			_layer.position$ = new Transitionable(_birth.position);
			_layer.size$ = new Transitionable(_birth.size);
			this.add({
						transform: _layer.position$.map(p => Transform.translate([p[0], p[1], p[2]])), 
						size: _layer.size$ 
					})
					.add(new Surface(layer.surface));
		}			
		
		layer.items.forEach(item => this.addItem(item, _layer));
		
		return _layer;		
	},
	
	addItem: function(item, layer) {
		var position$ = new Transitionable(layer.birth.position),
				size$ = new Transitionable(layer.birth.size);
		
		this.add({
					transform: position$.map(p => Transform.translate([p[0], p[1], p[2]])), 
					size: size$
				})
				.add(item);
		
		item.setMargins(layer.margins);
		layer.items.push(item);
		this.attached.set(item, {layer, position$, size$});
	},
	
	layout: function(layer) {
		layer.packer(layer.items, layer.size).forEach(pitem => {
			var aitem = this.attached.get(pitem.item),
					p = pitem.position,
					c = layer.absCorners;
			aitem.position$.set([c[0] + p[0], c[1] + p[1], 0], this.options.transition);
			aitem.size$.set(pitem.size, this.options.transition);
		});
	},
	
	refresh: function(layer) {
		var c = layer.absCorners = getAbsCorners(layer.defCorners, this.getSize());
		layer.size = [c[2] - c[0], c[3] - c[1]];
		this.layout(layer);
		if(!layer.surface) return;
		layer.position$.set([c[0], c[1], 0], this.options.transition);
		layer.size$.set(layer.size, this.options.transition);
	},
	
	refreshAll: function() {
		Object.values(this.layers).forEach(this.refresh.bind(this));
	}
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



