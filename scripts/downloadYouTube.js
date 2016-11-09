'use strict';

const youtubeSearch = require('youtube-search');
const Defer = require('./Defer.js');
const _ = require('lodash');
const ytdl = require('ytdl-core');

const downloadFile = require('./downloadFile.js');

const DOWNLOAD_SETTINGS = {
	mp4: {
		quality: 18 // mp4, 360p according to https://en.wikipedia.org/wiki/YouTube#Quality_and_formats
	},
	m4a: {
		quality: 140 // m4a, 128kbit/s according to https://en.wikipedia.org/wiki/YouTube#Quality_and_formats
	}
};

module.exports = apiKey => {
	const opts = {
	  maxResults: 1,
	  key: apiKey
	};

	return (title, query, filename) =>
		searchTrailer(title, query, opts).
			then(link =>
				downloadVideo(title, link, filename));
};
function searchTrailer(title, query, opts) {
	return Defer(deferred => {
		youtubeSearch(query.join(' '), opts, (err, results) => {
			if (err) {
				deferred.reject(title + ': Unable to find a video. Is the YouTube Data API key correct?');
			}

			deferred.resolve(_.get(results, '[0].link'));
		});
	});
}
function downloadVideo(title, uri, filename) {
	const ext = _.last(_.last(filename).split('.'));

	return downloadFile('video', title, uri, filename, () => ytdl(uri, DOWNLOAD_SETTINGS[ext]));
}