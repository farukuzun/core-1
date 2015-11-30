/**
* ownCloud
*
* @author Vincent Petry
* @copyright 2015 Vincent Petry <pvince81@owncloud.com>
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
* License as published by the Free Software Foundation; either
* version 3 of the License, or any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU AFFERO GENERAL PUBLIC LICENSE for more details.
*
* You should have received a copy of the GNU Affero General Public
* License along with this library.  If not, see <http://www.gnu.org/licenses/>.
*
*/

describe('OCA.SystemTags.SystemTagsView tests', function() {
	var view, tooltipStub, testFileInfo;

	beforeEach(function() {
		tooltipStub = sinon.stub($.fn, 'tooltip');

		view = new OCA.SystemTags.SystemTagsView();

		testFileInfo = new OCA.Files.FileInfoModel({
			id: 5,
			name: 'One.txt',
			mimetype: 'text/plain',
			permissions: 31,
			path: '/subdir',
			size: 123456789,
			etag: 'abcdefg',
			mtime: Date.UTC(2015, 6, 17, 1, 2, 0, 0)
		});
	});
	afterEach(function() {
		view.remove();
		view = undefined;
		tooltipStub.restore();

	});
	describe('rendering', function() {
		it('displays TODO', function() {
			view.setFileInfo(testFileInfo);
			expect(false).toEqual(true);
		});
	});
});
