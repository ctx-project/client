import Autocomplete from './autocomplete.js'
import Topics from './topics.js'
var View = Samsara.Core.View,
		Surface = Samsara.DOM.Surface;

export default View.extend({
	initialize: function() {
		this.add(new Surface({
			properties: {
				background: 'url("_/bg.jpg")',
				'background-size': 'cover'
			}
		}));
		
		var autocomplete = new Autocomplete({size: [600, true]});
		this.add({
			align: [.5, .05]
		}).add(autocomplete);
		
		var topics = new Topics({size: [600, 100]});
		this.add({
			align: [.5, .15]
		}).add(topics);

	}
});