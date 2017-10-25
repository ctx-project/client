function reseed() {
	//https://gist.github.com/mathiasbynens/5670917
	Math.random = (function() {
		var seed = 0x2F6E2B1;
		return function() {
			// Robert Jenkins’ 32 bit integer hash function
			seed = ((seed + 0x7ED55D16) + (seed << 12))	& 0xFFFFFFFF;
			seed = ((seed ^ 0xC761C23C) ^ (seed >>> 19)) & 0xFFFFFFFF;
			seed = ((seed + 0x165667B1) + (seed << 5))	 & 0xFFFFFFFF;
			seed = ((seed + 0xD3A2646C) ^ (seed << 9))	 & 0xFFFFFFFF;
			seed = ((seed + 0xFD7046C5) + (seed << 3))	 & 0xFFFFFFFF;
			seed = ((seed ^ 0xB55A4F09) ^ (seed >>> 16)) & 0xFFFFFFFF;
			return (seed & 0xFFFFFFF) / 0x10000000;
		};
	}());
}

export function random(items, size, sizer) {
	reseed();
	return items.map(item => ({
		item, 
		size: sizer(item), 
		position: [Math.random() * size[0], Math.random() * size[1]], 
	}));
} 

export function fill(items, size) {
	return items.map(item => ({
		item, 
		size, 
		position: [0, 0],
		margins: [0, 0]
	}));
}

export function contain(items, size, sizer, margins = [0, 0]) {
	var	padded = [size[0] - 2 * margins[0], size[1] - 2 * margins[1]];
	
	return items.map(item => {
		var isize = sizer(item),
				c = contain(padded, isize);
		
		return {
			item, 
			size: c, 
			position: [(size[0] - c[0]) / 2, (size[1] - c[1]) / 2],
			margins: [0, 0]
		}
	});
	
	function contain(o, i) {
		return o[0] / o[1] > i[0] / i[1] ? [o[1] / i[1] * i[0], o[1]] : [o[0], o[0] / i[0] * i[1]];
	}
}

export function horizontalLine(items, size, sizer, margin) {
	var distance = 0;
	return items.map(item => {
		var isize = sizer(item),
				state = {
					item, 
					size: isize, 
					position: [distance, (size[1] - isize[1]) / 2],
					margins: [0, 0],
				};
		
		distance += isize[0] + margin;
		
		return state;
	});
}

export function wrap(items, size, sizer, cellSize) {
	var count = Math.floor(size[0] / cellSize[0]),
			row = 0, col = 0;
	return items.map(item => {
		if(col == count) { row++; col = 0; }

		var state = {
			item, 
			size: sizer(item), 
			position: [col * cellSize[0], row * cellSize[1]],
			margins: [0, 0],
		};
		
		col++;
		
		return state;
	});
}

	
export function pressureArea(items, size, sizer, orderings, ranker, resizer, margins) {
	var start = performance.now(),
			rank = 0, r,
			trial = items.map(item => {
				var size = sizer(item);
				return {
					item, 
					size, area: size[0] * size[1], ratio: size[0] / size[1], 
					w: size[0], h: size[1], width: size[0], height: size[1], 
					pressure: 1};
			}),
			best = null,
			resized = null;
			
	reseed();		
			
	for(;;) {
		for(var i = 0; i < orderings.length; i++) {
			var ordering = orderings[i];
			trial.forEach(titem => titem.order = ordering(titem));
			trial.sort(sort);
			
			new Packer(size[0], size[1]).fit(trial);

			if(trial.every(t => t.fit) && (r = ranker(trial)) > rank) {
				rank = r;
				best = trial;
				trial = trial.map(t => Object.assign({}, t));
			}
			
			if(isLate(rank, start)) return state();
			trial.forEach(t => t.fit = undefined);
		}
		
		if(isLate(rank, start) || !(resized = resizer(trial))) return state();
		resized.w = resized.width;
		resized.h = resized.height;
	} 
	
	
	function state() {
		return best ? best.map(t => ({item: t.item, position: [t.fit.x, t.fit.y], size: [t.w, t.h], margins})) : [];
	}
}

function sort(t1, t2) {
	return t1.order - t2.order;
}

function isLate(rank, start) {
	// return true;
	var time = performance.now() - start;
	return Math.max(time * rank, time / 10) > 50;
}
