// <!--<script async defer	src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCdBe_ui57UfS23cCnSjngyd6NQskwhDZY"></script>-->


(function() {
	Viewer.name = 'map';
	Viewer.type = 'cover';
	
	var regex = /(^|\s+)-?\d{1,2}\.?\d*\s*,\s*\d{1,3}\.?\d*($|\s+)/;
	
	Viewer.sniff = function(items) {
		return items.filter(l => l.match(regex)).length / items.length;
	}
	
	function Viewer(panel) {
		var map = new google.maps.Map(panel.content, {
			mapTypeId: google.maps.MapTypeId.TERRAIN,
			scrollwheel: false,
			disableDefaultUI: true
		}),
		bounds = new google.maps.LatLngBounds();

		panel.items
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



