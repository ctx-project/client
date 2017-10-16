import {debounce} from './helper.js'

var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		Stream = Samsara.Streams.Stream,
		TouchInput = Samsara.Inputs.TouchInput;


export default View.extend({
	defaults: {
		layers: [],
		transition: {curve : 'easeInCubic', duration: 250 }
	},
	
	initialize: function(options) {
		this.layers = {};
		this.attached = new WeakMap();
		
		this.size.on('start', () => {
			if(!this.getSize()[0]) return;
			
			options.layers.forEach(layer => this.refreshLayer(this.addLayer(layer)));
			
			this.size.off('start');
			
			var refresh = debounce(this.refreshLayers.bind(this), 300);
			this.size.on('start', refresh);
			this.size.on('update', refresh);
		});
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
				dragZ: layer.dragZ || 1,
				packer: layer.packer || (() => []),
				birth: {
					position: [_birth.position[0] + _birth.size[0] / 2, _birth.position[1] + _birth.size[1] / 2, 0], 
					size: [0, 0]
				}
			};
		
		if(layer.surface) {
			_layer.position$ = new Transitionable(_birth.position);
			_layer.size$ = new Transitionable(_birth.size);
			_layer.opacity$ = new Transitionable(1);
			this.add({
						transform: _layer.position$.map(p => Transform.translate([p[0], p[1], p[2]])), 
						size: _layer.size$,
						opacity: _layer.opacity$
					})
					.add(new Surface(layer.surface));
		}			
		
		layer.items.forEach(item => this.addItem(item, _layer));
		
		return _layer;		
	},
	
	layoutLayer: function(layer) {
		layer.packer(layer.items, layer.size).forEach(pitem => this.moveItem(pitem.item, pitem));
	},
	
	refreshLayer: function(layer) {
		var c = layer.absCorners = getAbsCorners(layer.defCorners, this.getSize());
		layer.size = [c[2] - c[0], c[3] - c[1]];
		this.layoutLayer(layer);
		if(!layer.surface) return;
		layer.position$.set([c[0], c[1], 0], this.options.transition);
		layer.size$.set(layer.size, this.options.transition);
	},
	
	refreshLayers: function() {
		Object.values(this.layers).forEach(this.refreshLayer.bind(this));
	},
	
	switchLayer: function(item, layer) {
		var aitem = this.attached.get(item),
				oldLayer = aitem.layer;
				
		aitem.layer = null;
		oldLayer.items.splice(oldLayer.items.indexOf(item), 1);
		this.layoutLayer(oldLayer);
		
		if(!layer) return;
		
		aitem.layer = layer;
		this.setItemZ(item, 'baseZ');
		layer.items.push(item);
		this.layoutLayer(layer);
	},
	
	setLayerOpacity: function(layer, opacity) {
		layer.opacity$.set(opacity, this.options.transition);
		layer.items.forEach(item => this.attached.get(item).opacity$.set(opacity, this.options.transition));
	},

	addItem: function(item, layer) {
		var position$ = new Transitionable(layer.birth.position),
				size$ = new Transitionable(layer.birth.size),
				margins$ = new Transitionable([0, 0]),
				opacity$ = new Transitionable(1);
		
		this.add({
					transform: position$.map(p => Transform.translate([p[0], p[1], p[2]])), 
					size: size$,
					margins: margins$,
					opacity: opacity$
				})
				.add(item);
		
		item.setProperties({zIndex: layer.baseZ});
		layer.items.push(item);
		this.attached.set(item, {layer, position$, size$, margins$, opacity$});
	},
	
	moveItem: function(item, state) {
		var aitem = this.attached.get(item),
				p = state.position,
				c = aitem.layer.absCorners;
		
		if(p) aitem.position$.set([c[0] + p[0], c[1] + p[1], 0], this.options.transition);
		if(state.size) aitem.size$.set(state.size, this.options.transition);
		if(state.margins) aitem.margins$.set(state.margins, this.options.transition);
		
		aitem.state = state;
	},
	
	setItemZ: function(item, key) {
		item.setProperties({zIndex: this.attached.get(item).layer[key]});
	},
	
	startDragItem: function(item) {
		this.setItemZ(item, 'dragZ');
	},
	
	endDragItem: function(item) {
		this.setItemZ(item, 'baseZ');
	},
	
	dragItem: function(item, delta) {
		var aitem = this.attached.get(item),
				pos = aitem.position$.get();

		aitem.position$.set([pos[0] + delta[0], pos[1] + delta[1]]);		
	},
	
	returnItem: function(item) {
		this.moveItem(item, this.attached.get(item).state);
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



