/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {

	function filterFunction(model, term) {
		return model.get('name').substr(0, term.length) === term;
	}

	/**
	 * @class OCA.SystemTags.SystemTagsCollection
	 * @classdesc
	 *
	 * Collection of tags assigned to a file
	 *
	 */
	var SystemTagsCollection = OC.Backbone.Collection.extend(
		/** @lends OCA.SystemTags.SystemTagsCollection.prototype */ {

		sync: OC.Backbone.davSync,

		model: OCA.SystemTags.SystemTagModel,

		url: function() {
			return OC.linkToRemote('dav') + '/systemtags/';
		},

		filterByName: function(name) {
			return this.filter(function(model) {
				return filterFunction(model, name);
			});
		}
	});

	OCA.SystemTags.SystemTagsCollection = SystemTagsCollection;
})();

