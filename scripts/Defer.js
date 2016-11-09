const Q = require('q');

module.exports = f => {
  const deferred = Q.defer();

  f(deferred);

  return deferred.promise;
};