'use strict';

const _ = require('lodash');
const Defer = require('./Defer.js');

const promise = {};

const CALLS_MAP = {
  movie: 'genreMovieList',
  tv: 'genreTvList'
};

module.exports = (type, MovieDB) => {
  if (!promise[type]) {
    promise[type] = createPromise(type, MovieDB);
  }
  return promise[type];
};

function createPromise(type, MovieDB) {
  return Defer(deferred => {
    const call = CALLS_MAP[type];

    MovieDB[call]({}, (err, res) => {
      if (!res || !res.genres) {
        promise[type] = false;
        deferred.reject('Unable to fetch genres from TMDb, please check your API key.');
        return;
      }

      deferred.resolve(_(res.genres).keyBy('id').mapValues('name').value());
    });
  });
}