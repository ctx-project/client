import {debounce, clone} from './helper.js'

var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface,
		Transform = Samsara.Core.Transform,
		Transitionable = Samsara.Core.Transitionable,
		Stream = Samsara.Streams.Stream,
		TouchInput = Samsara.Inputs.TouchInput,
		identityTransform = {scale: [1, 1, 1], rotate: [0, 0, 0]};


export default View.extend({
	defaults: {
		layers: [],
		transition: {curve : 'easeInCubic', duration: 270 },
		throwSpeed: 2,
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
		var	_layer = this.layers[layer.name] = {
				name: layer.name,
				items: [],
				defCorners: layer.corners || [0, 0, 1, 1],
				surface: layer.surface,
				margins: layer.margins || [0, 0],
				opacity: !layer.opacity && layer.opacity !== 0 ? 1 : layer.opacity,
				transform: Object.assign(clone(identityTransform), layer.transform),
				baseZ: layer.baseZ || 0,
				dragZ: layer.dragZ,
				packer: layer.packer,
				birth: layer.birth || [.5, .5],
				death: layer.death || [.5, .5],
				selector: layer.selector || identity,
				handler: layer.handler,
				gestures: layer.gestures,
			};
			
		_layer.absCorners = getAbsCorners(_layer.defCorners, this.getSize());	 	
		
		if(layer.surface) {
			_layer.position$ = new Transitionable(getAbsPoint(_layer.absCorners, _layer.birth));
			_layer.size$ = new Transitionable([0, 0]);
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
	
	getLayer: function(layer) {
		return typeof layer == 'string' ? this.layers[layer] : layer;
	},
	
	layoutLayer: function(layer) {
		layer = this.getLayer(layer);
		
		if(layer.packer)
			layer.packer(layer.items, layer.size).forEach(state => this.moveItem(state.item, state, layer));
		else
			; //?layout all projected layers
			
		return this;	
	},
	
	layoutLayers: function(layers) {
		layers = layers || Object.values(this.layers);
		layers.forEach(this.layoutLayer.bind(this));
		
		return this;
	},
	
	refreshLayer: function(layer) {
		layer = this.getLayer(layer);
		var c = layer.absCorners = getAbsCorners(layer.defCorners, this.getSize());
		layer.size = [c[2] - c[0], c[3] - c[1]];
		this.layoutLayer(layer);
		if(!layer.surface) return this;
		layer.position$.set([c[0], c[1], 0], this.options.transition);
		layer.size$.set(layer.size, this.options.transition);
		
		return this;
	},
	
	refreshLayers: function(layers) {
		layers = layers || Object.values(this.layers);
		layers.forEach(this.refreshLayer.bind(this));
		
		return this;
	},
	
	setLayerOpacity: function(layer, opacity) {
		layer = this.getLayer(layer);
		layer.opacity = opacity;
		if(layer.surface) layer.opacity$.set(opacity, this.options.transition);
		this.getLayerAItems(layer).forEach(aitem => aitem.opacity$.set(opacity, this.options.transition));
		
		return this;
	},
	
	transformLayer: function(layer, state) {
		layer = this.getLayer(layer);
		var t = layer.transform;
		t.rotate = state.rotate || t.rotate;
		t.scale = state.scale || t.scale;
		
		this.getLayerAItems(layer).forEach(aitem => this._transformItem(aitem, state));
		
		return this;
	},
	
	_transformItem: function(aitem, state) {
		if(state.scale) aitem.scale$.set(state.scale, this.options.transition);
		if(state.rotate) aitem.rotate$.set(state.rotate, this.options.transition);
	},
	
	retransformLayer: function(layer) {
		layer = this.getLayer(layer);
		this.transformLayer(layer, identityTransform);
		
		return this;
	},
	
	getLayerAItems: function(layer) {
		return layer.items.map(item => this.attached.get(item)).filter(aitem => aitem.layer == layer);
	},
	
	backLayer: function(layer) {
		layer = this.getLayer(layer);
		while(layer.items[0]) this.backItem(layer.items[0]);
		
		return this;
	},

	addItem: function(item, layer) {
		layer = this.getLayer(layer);
		var position$ = new Transitionable(getAbsPoint(layer.absCorners, layer.birth)),
				size$ = new Transitionable([0, 0]),
				margins$ = new Transitionable([0, 0]),
				opacity$ = new Transitionable(layer.opacity),
				scale$ = new Transitionable(layer.transform.scale),
				rotate$ = new Transitionable(layer.transform.rotate),
				handle = layer.selector(item),
				input = new TouchInput();
				
		input.subscribe(handle);
		if(layer.dragZ) {
			input.on('start', e => this.setItemZ(item, 'dragZ'));
			input.on('update', e => this.dragItem(item, e.delta));
		}
		input.on('end', e => inputEnd.bind(this)(e, item));

		this.add({
					transform: position$.map(p => Transform.translate([p[0], p[1], p[2]])), 
					size: size$,
					margins: margins$,
					opacity: opacity$,
				})
				.add({
					origin: [.5, .5],
					align: [.5, .5],
					transform: Stream.lift((scale, rotate) => Transform.composeMany(
						Transform.scale(scale),
						Transform.rotateX(rotate[0]),
						Transform.rotateY(rotate[1]),
						Transform.rotateZ(rotate[2])
					), [scale$, rotate$])
				})
				.add(item);
		
		item.setProperties({zIndex: layer.baseZ});
		layer.items.push(item);
		this.attached.set(item, {
			layer, back: [], 
			position$, size$, margins$, opacity$, scale$, rotate$, 
			state: {[layer.name]: {}}
		});
		
		return this;
	},
	
	moveItem: function(item, state, layer) {
		layer = this.getLayer(layer);
		var aitem = this.attached.get(item),
				p = state.position,
				al = aitem.layer,
				l = layer || al,
				c = l.absCorners,
				astate = aitem.state[l.name];
		
		astate.position = state.position;
		astate.size = state.size;
		astate.margins = state.margins;
		
		//?should check if intermediary layers do not have packer
		if(l != al && al.packer) return this;
		
		if(p) aitem.position$.set([c[0] + p[0], c[1] + p[1], 0], this.options.transition);
		if(state.size) aitem.size$.set(state.size, this.options.transition);
		if(state.margins) aitem.margins$.set(state.margins, this.options.transition);
		
		return this;
	},
	
	switchItem: function(item, layer) {
		layer = this.getLayer(layer);
		var aitem = this.attached.get(item);
				
		aitem.back.push(aitem.layer);
		aitem.back.forEach(layer => layer.items.splice(layer.items.indexOf(item), 1));
		aitem.back = [];
		aitem.state = {};
		
		if(!layer) return this;
		
		this._setItemLayer(item, aitem, layer);
		
		return this;
	},
	
	projectItem: function(item, layer) {
		layer = this.getLayer(layer);
		var aitem = this.attached.get(item),
				oldLayer = aitem.layer;
				
		aitem.back.push(oldLayer);
		
		this._setItemLayer(item, aitem, layer);
		
		if(!layer.packer) aitem.state[layer.name] = aitem.state[oldLayer.name];
		
		return this;
	},
	
	backItem: function(item) {
		var aitem = this.attached.get(item),
				layer = aitem.layer;
		
		aitem.state[aitem.layer.name] = null;
		layer.items.splice(layer.items.indexOf(item), 1);
		
		this._setItemLayer(item, aitem, aitem.back.pop(), true);
		
		return this;
	},
	
	_setItemLayer: function(item, aitem, layer, already) {
		aitem.layer = layer;
		aitem.opacity$.set(layer.opacity, this.options.transition);
		this._transformItem(aitem, layer.transform);
		this.setItemZ(item, 'baseZ');
		
		if(already) return this;
		
		layer.items.push(item);
		aitem.state[layer.name] = {};
		
		return this;
	},
	
	returnItem: function(item) {
		var aitem = this.attached.get(item);
		this.moveItem(item, aitem.state[aitem.layer.name]);
		
		return this;
	},
	
	setItemZ: function(item, key) {
		item.setProperties({zIndex: this.attached.get(item).layer[key]});
		
		return this;
	},
	
	dragItem: function(item, delta) {
		var aitem = this.attached.get(item),
				pos = aitem.position$.get();

		aitem.position$.set([pos[0] + delta[0], pos[1] + delta[1]]);		
		
		return this;
	},
	
	getItemIndex: function(item) {
		return this.attached.get(item).layer.items.indexOf(item);
	},
	
	removeItem: function(item) {
		var aitem = this.attached.get(item),
				layer = aitem.layer,
				death = layer.death;
		
		this.switchItem(item);
		
		this.attached.delete(item);
		item.remove();
		// aitem.size$.set([0, 0], this.options.transition);
		// if(death) aitem.position$.set(death.position, this.options.transition);
		
		return this;
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

function getAbsPoint(r, d) {
	return [
		r[0] + (r[2] - r[0]) * d[0],
		r[1] + (r[3] - r[1]) * d[1],
	];
}

function identity(item) {
	return item;
}



