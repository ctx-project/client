export default function Viewer(panel) {
};

Viewer.key = 'map';
Viewer.type = 'cover';
Viewer.populate = true;

var regex = /(^|\s+)-?\d{1,2}\.?\d*\s*,\s*\d{1,3}\.?\d*($|\s+)/;

Viewer.sniff = function(records) {
	return records.filter(r => r.item.match(regex)).length / records.length;
}


Viewer.prototype.desired = function() {
	//?should compute from bounds -> ratio, count -> multiplier
	return [500, 300];
}

Viewer.prototype.update = function() {
	this.records = this.panel.records;
	
	var content = document.createElement('div');
	content.style="width:100%; height: 100%";
	this.panel.content.setContent(content);
	
	var map = new google.maps.Map(content, {
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		scrollwheel: false,
		disableDefaultUI: true
	}),
	bounds = new google.maps.LatLngBounds();

	this.records
		.map(r => r.item.match(regex))
		.filter(l => l)
		.forEach(l => { 
			var parts = l[0].split(','),
					position = {lat: +parts[0], lng: +parts[1]},
					title = l.input.replace(/\s*~\d*\s*$/, '').replace(regex, '');
			
			new google.maps.Marker({position, map, title});
			bounds.extend(position);
		});
		
	map.fitBounds(bounds);
	
	this.panel.requestLayout();
}
