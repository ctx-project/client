import Autocomplete from './autocomplete.js'
var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface;

export default View.extend({
	initialize: function() {
		this.add(new Surface({
			properties: {
				background: 'url("http://www.wallpaperup.com/wallpaper/download/297307/2560/1600")',
				'background-size': 'cover'
			}
		}));
		
		var autocomplete = new Autocomplete();
		
		this.add({
			align: [.5, 0]
		}).add(autocomplete);
	}
});