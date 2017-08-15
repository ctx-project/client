(function() {
	Viewer.name = 'map';
	Viewer.type = 'cover';
	
	var regex = /(^|\s+)-?\d{1,2}\.?\d*\s*,\s*\d{1,3}\.?\d*($|\s+)/;
	
	Viewer.sniff = function(lines) {
		return lines.filter(l => l.match(regex)).length / lines.length;
	}
	
	function Viewer(dom, lines) {
		var map = new google.maps.Map(dom, {
			mapTypeId: google.maps.MapTypeId.TERRAIN,
			scrollwheel: false,
			disableDefaultUI: true
		}),
		bounds = new google.maps.LatLngBounds();

		lines
			.map(l => l.match(regex))
			.filter(m => m)
			.forEach(m => { 
				var parts = m[0].split(','),
						position = {lat: +parts[0], lng: +parts[1]},
						title = m.input.replace(/\s*~\d*\s*$/, '').replace(regex, '');
				
				new google.maps.Marker({position, map, title});
				bounds.extend(position);
			});
			
			map.fitBounds(bounds);
	}	
	
	Viewer.prototype.desired = function() {
		return [8, 6];
	}
	
	Viewer.prototype.resize = function(size) {
	}
	
	Viewer.prototype.update = function(text) {
		
	}
	
	Viewers.push(Viewer);
	
})();



