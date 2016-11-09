const fs = require('fs');
const path = require('path');

const Defer = require('./Defer.js');

const VALID_PATHS = {};

module.exports = (type, title, uri, filePath, f) =>
  Defer(deferred => {
    if (_.isArray(filePath)) {
      filePath = path.join.apply(null, filePath);
    }
    filePath = filePath.replace(/\'|"/g, '_');
    
    if (!uri) {
      deferred.reject(title + ': No url was supplied.');
      return;
    }

    makePathForFile(filePath);

    f().pipe(
      fs.createWriteStream(filePath).
      on('error', () => deferred.reject(title + ': Failed to download ' + type + ' to ' + filePath + '.')).
      on('close', () => deferred.resolve(title + ': Successfully downloaded ' + type))
    );
  }
);

function makePathForFile(filePath) {
  filePath = path.parse(filePath);
  let curPath = filePath.root;
  filePath = filePath.dir.slice(curPath.length).split(path.sep);

  for (let i = 0; i < filePath.length; i += 1) {
    curPath += filePath[i] + path.sep;

    if (!VALID_PATHS[curPath]) {
      if (!fs.existsSync(curPath)){
          fs.mkdirSync(curPath);
      }
      VALID_PATHS[curPath] = true;
    }
    VALID_PATHS[curPath] = true;
  }

  return path;
}