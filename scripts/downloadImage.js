const downloadFile = require('./downloadFile.js');
const request = require('request');

module.exports = (title, uri, filename) =>
	downloadFile('image', title, uri, filename, () =>
    request(uri));