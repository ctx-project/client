var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface;

export default View.extend({
	initialize: function() {
		this.add(new Surface({
			properties: {
				// background: 'url("_/bg.jpg")',
				// 'background-size': 'cover'
				background: '#CFD8DC'
			}
		}));
		
		// var autocomplete = new Autocomplete({width: 600, inputHeight: 50, contentHeight: 400});
		// this.add({
		// 	align: [.5, .05]
		// }).add(autocomplete);
		// autocomplete.on('start', () => l('start'));
		// autocomplete.on('end', v => l('end ' + v));
		// autocomplete.on('update', search => autocomplete.setResults(Array(6).fill().map(() => search)));
		
	}
});