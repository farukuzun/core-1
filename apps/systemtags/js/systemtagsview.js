/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/* global Handlebars */

(function() {
	var TEMPLATE =
		'<div class="systemTagsContainer">' +
		'<input type="hidden" name="tags" value="" style="width: 100%"/>' +
		'</div>';

	var RESULT_TEMPLATE =
		'<span class="systemtags-item{{#if isNew}} new-item{{/if}}" data-id="{{id}}">' +
		'    <span class="checkmark icon icon-checkmark"></span>' +
		'    <span class="label">{{name}}</span>' +
		'    <span class="systemtags-actions">' +
		'        <a href="#" class="rename icon icon-rename" title="{{renameTooltip}}"></a>' +
		'    </span>' +
		'</span>';

	var RENAME_FORM_TEMPLATE =
		'<form class="systemtags-rename-form">' +
		'    <label class="hidden-visually" for="{{cid}}-rename-input">{{renameLabel}}</label>' +
		'    <input id="{{cid}}-rename-input" type="text" value="{{name}}">' +
		'    <a href="#" class="delete icon icon-delete" title="{{deleteTooltip}}"></a>' +
		'</form>';

	function convertResult(model) {
		return model.toJSON();
	}

	/**
	 * @class OCA.SystemTags.SystemTagsView
	 * @classdesc
	 *
	 * Displays a file's system tags
	 *
	 */
	var SystemTagsView = OCA.Files.DetailFileInfoView.extend(
		/** @lends OCA.SystemTags.SystemTagsView.prototype */ {

		_rendered: false,

		_newTag: null,

		_dummyId: -1,

		className: 'systemTagsView',

		template: function(data) {
			if (!this._template) {
				this._template = Handlebars.compile(TEMPLATE);
			}
			return this._template(data);
		},

		initialize: function(options) {
			options = options || {};

			this.allTagsCollection = new OCA.SystemTags.SystemTagsCollection();

			this.selectedTagsCollection = new OCA.SystemTags.SystemTagsMappingCollection([], {objectType: 'files'});
			this.selectedTagsCollection.on('sync', this._onTagsChanged, this);
			this.selectedTagsCollection.on('remove', this._onTagsChanged, this);
			this.selectedTagsCollection.on('change', this._onTagsChanged, this);
			// if a tag got renamed in the complete selectedTagsCollection, also update them
			// in the selected list
			this.allTagsCollection.on('change:name', this._onTagRenamedInCollection, this);

			_.bindAll(
				this,
				'_onClickRenameTag',
				'_onClickDeleteTag',
				'_onSelectTag',
				'_onDeselectTag',
				'_onSubmitRenameTag'
			);
		},

		_onTagRenamedInCollection: function(changedTag) {
			// also rename it in the selection, if applicable
			var selectedTagMapping = this.selectedTagsCollection.get(changedTag.id);
			if (selectedTagMapping) {
				selectedTagMapping.set(changedTag.toJSON());
			}
		},

		_onClickRenameTag: function(ev) {
			var $item = $(ev.target).closest('.systemtags-item');
			var tagId = $item.attr('data-id');
			var tagModel = this.allTagsCollection.get(tagId);
			if (!this._renameFormTemplate) {
				this._renameFormTemplate = Handlebars.compile(RENAME_FORM_TEMPLATE);
			}

			var oldName = tagModel.get('name');
			var $renameForm = $(this._renameFormTemplate({
				cid: this.cid,
				name: oldName,
				deleteTooltip: t('core', 'Delete'),
				renameLabel: t('core', 'Rename')
			}));
			$item.find('.label').after($renameForm);
			$item.find('.label, .systemtags-actions').addClass('hidden');
			$item.closest('.select2-result').addClass('has-form');

			$renameForm.find('[title]').tooltip({
				placement: 'bottom',
				container: 'body'
			});
			$renameForm.find('input').focus().selectRange(0, oldName.length);
			return false;
		},

		_onSubmitRenameTag: function(ev) {
			ev.preventDefault();
			var $form = $(ev.target);
			var $item = $form.closest('.systemtags-item');
			var tagId = $item.attr('data-id');
			var tagModel = this.allTagsCollection.get(tagId);
			var newName = $(ev.target).find('input').val();
			if (newName && newName !== tagModel.get('name')) {
				tagModel.save({'name': newName});
				// TODO: spinner, and only change text after finished saving
				$item.find('.label').text(newName);
			}
			$item.find('.label, .systemtags-actions').removeClass('hidden');
			$form.remove();
			$item.closest('.select2-result').removeClass('has-form');
		},

		_onClickDeleteTag: function(ev) {
			var $item = $(ev.target).closest('.systemtags-item');
			var tagId = $item.attr('data-id');
			this.allTagsCollection.get(tagId).destroy();
			this.selectedTagsCollection.remove(tagId);
			$item.closest('.select2-result').remove();
			// TODO: spinner
			return false;
		},

		setFileInfo: function(fileInfo) {
			if (!this._rendered) {
				this.render();
			}

			if (fileInfo) {
				this.selectedTagsCollection.setObjectId(fileInfo.id);
				this.selectedTagsCollection.fetch();
				this.$el.removeClass('hidden');
			} else {
				this.$el.addClass('hidden');
			}
		},

		_onTagsChanged: function() {
			this.$el.removeClass('hidden');
			this.$tagsField.select2('val', this.selectedTagsCollection.getTagIds());
		},

		_onSelectTag: function(e) {
			var self = this;
			if (e.object && e.object.id < 0) {
				// newly created tag, check if existing
				var existingTags = this.allTagsCollection.where({name: e.object.name});

				if (existingTags.length) {
					// create mapping to existing tag
					self.selectedTagsCollection.create(existingTags[0].toJSON(), {
						error: function(model, response) {
							if (response.status === 409) {
								self._onTagsChanged();
								OC.Notification.showTemporary(t('core', 'Tag already exists'));
							}
						}
					});
				} else {
					// create a new mapping
					this.selectedTagsCollection.create({
						name: e.object.name,
						userVisible: true,
						userAssignable: true,
					});
					this.allTagsCollection.fetched = false;
				}
			} else {
				// put the tag into the mapping selectedTagsCollection
				this.selectedTagsCollection.create(e.object);
			}
			this._newTag = null;
		},

		_queryTagsAutocomplete: function(query) {
			var self = this;
			if (this.allTagsCollection.fetched) {
				// cached
				query.callback({
					results: _.map(self.allTagsCollection.filterByName(query.term), convertResult)
				});
				return;
			}

			this.allTagsCollection.fetch({
				success: function() {
					self.allTagsCollection.fetched = true;
					query.callback({
						results: _.map(self.allTagsCollection.filterByName(query.term), convertResult)
					});
				}
			});
		},

		_onDeselectTag: function(e) {
			this.selectedTagsCollection.get(e.choice.id).destroy();
		},

		_preventDefault: function(e) {
			e.stopPropagation();
		},

		_formatDropDownResult: function(data) {
			if (!this._resultTemplate) {
				this._resultTemplate = Handlebars.compile(RESULT_TEMPLATE);
			}
			return this._resultTemplate(_.extend({
				renameTooltip: t('core', 'Rename')
			}, data));
		},

		/**
		 * Renders this details view
		 */
		render: function() {
			var self = this;
			this.$el.html(this.template({
				tags: this._tags
			}));

			this.$el.find('[title]').tooltip({placement: 'bottom'});
			this.$tagsField = this.$el.find('[name=tags]');
			this.$tagsField.select2({
				placeholder: t('core', 'Global tags'),
				containerCssClass: 'systemtags-select2-container',
				dropdownCssClass: 'systemtags-select2-dropdown',
				closeOnSelect: false,
				allowClear: false,
				multiple: true,
				toggleSelect: true,
				query: _.bind(this._queryTagsAutocomplete, this),
				id: function(tag) {
					return tag.id;
				},
				initSelection: function(element, callback) {
					callback(self.selectedTagsCollection.toJSON());
				},
				formatResult: _.bind(this._formatDropDownResult, this),
				formatSelection: function(tag) {
					return '<span>' + escapeHTML(tag.name) + ',&nbsp;</span>';
				},
				createSearchChoice: function(term) {
					if (!self._newTag) {
						self._dummyId--;
						self._newTag = {
							id: self._dummyId,
							name: term,
							isNew: true
						};
					} else {
						self._newTag.name = term;
					}

					return self._newTag;
				}
			})
				.on('select2-selecting', this._onSelectTag)
				.on('select2-removing', this._onDeselectTag)
				.on('select2-open', this._onOpenDropDown);

			var $dropDown = this.$tagsField.select2('dropdown');
			// register events for inside the dropdown
			$dropDown.on('mouseup', '.rename', this._onClickRenameTag);
			$dropDown.on('mouseup', '.delete', this._onClickDeleteTag);
			$dropDown.on('mouseup', '.select2-result-selectable.has-form', this._preventDefault);
			$dropDown.on('submit', '.systemtags-rename-form', this._onSubmitRenameTag);

			this.delegateEvents();
		},

		remove: function() {
			this.$tagsField.select2('destroy');
		}
	});

	OCA.SystemTags.SystemTagsView = SystemTagsView;

})();

