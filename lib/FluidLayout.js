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
		transition: {curve : 'easeInCubic', duration: 300 },
		throwSpeed: 2.5,
		tapDistance: 10
	},
	
	initialize: function(options) {
		this.layers = {};
		this.attached = new WeakMap();
		
		this.size.on('start', () => {
			if(!this.getSize()[0]) return;
			
			options.layers.forEach(layer => this.refreshLayer(this.addLayer(layer)));
			
			this.size.off('start');
			
			// var refresh = debounce(() => this.refreshLayers(), 300);
			// this.size.on('start', refresh);
			// this.size.on('update', refresh);
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
				opacity: !layer.opacity && layer.opacity !== 0 ? 1 : layer.opacity,
				baseZ: layer.baseZ || 0,
				dragZ: layer.dragZ || 1,
				packer: layer.packer || (() => []),
				birth: {
					position: [_birth.position[0] + _birth.size[0] / 2, _birth.position[1] + _birth.size[1] / 2, 0], 
					size: [0, 0]
				},
				death: layer.death,
				extractor: layer.extractor || identity,
				handler: layer.handler,
				gestures: layer.gestures,
			};
		
		if(layer.surface) {
			_layer.position$ = new Transitionable(_birth.position);
			_layer.size$ = new Transitionable(_birth.size);
			_layer.opacity$ = new Transitionable(_layer.opacity);
			this.add({
						transform: _layer.position$.map(p => Transform.translate([p[0], p[1], p[2]])), 
						size: _layer.size$,
						opacity: _layer.opacity$
					})
					.add(new Surface(layer.surface));
		}			
		
		if(layer.items)
			layer.items.forEach(item => this.addItem(item, _layer));
		
		return _layer;		
	},
	
	layoutLayer: function(layer) {
		// l(layer.name);
		layer.packer(layer.items, layer.size).forEach(pitem => this.moveItem(pitem.item, pitem));
	},
	
	layoutLayers: function(layers) {
		layers = layers || Object.values(this.layers);
		layers.forEach(this.layoutLayer.bind(this));
	},
	
	refreshLayer: function(layer) {
		var c = layer.absCorners = getAbsCorners(layer.defCorners, this.getSize());
		layer.size = [c[2] - c[0], c[3] - c[1]];
		this.layoutLayer(layer);
		if(!layer.surface) return;
		layer.position$.set([c[0], c[1], 0], this.options.transition);
		layer.size$.set(layer.size, this.options.transition);
	},
	
	refreshLayers: function(layers) {
		layers = layers || Object.values(this.layers);
		layers.forEach(this.refreshLayer.bind(this));
	},
	
	transparentizeLayer: function(layer, opacity) {
		layer.opacity = opacity;
		if(layer.surface) layer.opacity$.set(opacity, this.options.transition);
		layer.items.forEach(item => this.attached.get(item).opacity$.set(opacity, this.options.transition));
	},

	addItem: function(item, layer) {
		var position$ = new Transitionable(layer.birth.position),
				size$ = new Transitionable(layer.birth.size),
				margins$ = new Transitionable([0, 0]),
				opacity$ = new Transitionable(1),
				handle = layer.extractor(item),
				input = new TouchInput();
				
		input.subscribe(handle);
		input.on('start', e => this.setItemZ(item, 'dragZ'));
		input.on('update', e => this.dragItem(item, e.delta));
		input.on('end', e => inputEnd.bind(this)(e, item));

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
	
	removeItem: function(item) {
		var aitem = this.attached.get(item),
				layer = aitem.layer,
				death = layer.death;
		
		layer.items.splice(layer.items.indexOf(item), 1);
		this.attached.delete(item);

		item.remove();
		// aitem.size$.set([0, 0], this.options.transition);
		// if(death) aitem.position$.set(death.position, this.options.transition);
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
	
	dragItem: function(item, delta) {
		var aitem = this.attached.get(item),
				pos = aitem.position$.get();

		aitem.position$.set([pos[0] + delta[0], pos[1] + delta[1]]);		
	},
	
	returnItem: function(item) {
		this.moveItem(item, this.attached.get(item).state);
	},
	
	getItemIndex: function(item) {
		return this.attached.get(item).layer.items.indexOf(item);
	},
	
	switchItem: function(item, layer) {
		var aitem = this.attached.get(item),
				oldLayer = aitem.layer;
				
		aitem.layer = null;
		if(oldLayer) oldLayer.items.splice(oldLayer.items.indexOf(item), 1);
		
		if(!layer) return;
		
		aitem.layer = layer;
		aitem.opacity$.set(layer.opacity, this.options.transition);
		this.setItemZ(item, 'baseZ');
		layer.items.push(item);
	},
	

});

function inputEnd(e, item) {
	var vx = e.velocity[0],
			vy = e.velocity[1],
			sx = Math.abs(vx),
			sy = Math.abs(vy),
			sm = Math.max(sx, sy),
			s = Math.sqrt(sx ** 2 + sy ** 2),
			c = e.cumulate,
			d = Math.sqrt(c[0] ** 2 + c[1] ** 2),
			o = this.options,
			l = this.attached.get(item).layer,
			gs = l.gestures,
			g;
	
	e.speed = s;
	e.distance = d;
	e.thrown = s > o.throwSpeed;
	e.tapped = d < o.tapDistance;
	e.orientation = sm == vy ? 'bottom' : 
									sm == -vy ? 'top' :
									sm == vx ? 'right' :
									'left';

	this.setItemZ(item, 'baseZ');
	
	var gesture = e.tapped ? 'tap' : e.orientation,
			type = e.thrown ? 'throw' : 'drag',
			gesturetype = `${gesture}.${type}`;
	
	if(l.handler) l.handler(item, e);
	
	//did not use inheritance because is costly to modify prototype and also 
	//i need gesture to override gesturetype from parent
	while(gs) {
		g = gs[gesturetype] || gs[gesture] || gs.default;
		if(g || !(l = this.layers[gs.parent])) break;
		gs = l.gestures;
	}
	
	if(g)	g(item, e);
}
	
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

function identity(item) {
	return item;
}



