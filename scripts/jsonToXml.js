const _ = require('lodash');
const EOL = require('os').EOL;
const TAB = '  ';

module.exports = json => '<?xml version="1.0" standalone="yes"?>' + jsonToXml(json, '');

function jsonToXml(json, space) {
	if (_.isPlainObject(json)) {
		return _.map(json, (val, key) => {
			if (_.isArray(val)) {
				return _.map(val, v => EOL + space + '<' + key + '>' + jsonToXml(v, space + TAB) + '</' + key + '>').join('');
			}
			return EOL + space + '<' + key + '>' + jsonToXml(val, space + TAB) + '</' + key + '>';
		}).join('');
	}
	return htmlEncode(json);
}
function htmlEncode(s) {
	return s.split('&').join('&amp;').replace(/\&amp;amp;/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
}