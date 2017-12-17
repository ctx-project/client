import * as H from '../lib/helper.js'

export default function Viewer(panel) {
	this.content = document.createElement('div');
	this.content.style = "width:100%; height: 100%";
	panel.content.setContent(this.content);
	this.ddraw = H.debounce(this.draw, 200);
};

Viewer.key = 'map';
Viewer.type = 'cover';
Viewer.populate = true;

var regex = /(^|\s+)-?\d{1,2}\.?\d*\s*,\s*\d{1,3}\.?\d*($|\s+)/;

Viewer.sniff = function(records) {
	return records.filter(r => r.item.match(regex)).length / (records.length || 1);
}


Viewer.prototype.desired = function() {
	//?should compute from bounds -> ratio, count -> multiplier
	return [500, 300];
}

Viewer.prototype.update = function() {
	this.panel.requestLayout();
	this.ddraw();
}

Viewer.prototype.draw = function() {
	var map = new google.maps.Map(this.content, {
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		scrollwheel: false,
		disableDefaultUI: true
	}),
	bounds = new google.maps.LatLngBounds();

	this.panel.records
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
};

