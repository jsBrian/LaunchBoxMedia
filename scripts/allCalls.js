'use strict';

const Q = require('q');

module.exports = allCalls;

function allCalls(fArray, deferred, index, results) {
  results = results || [];
  deferred = deferred || Q.defer();
  index = index || 0;

  deferred.notify(index / fArray.length);

  if (index < fArray.length) {
    let call = fArray[index];
    call().then(result => {
      results.push(result);
    }).fin(() => {
      allCalls(fArray, deferred, index + 1, results);
    });
  } else {
    deferred.resolve(results);
  }

  return deferred.promise;
}