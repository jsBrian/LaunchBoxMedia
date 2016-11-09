'use strict';

const _ = require('lodash');
const Q = require('q');

const fs = require('fs');
const path = require('path');

const Defer = require('./Defer.js');

module.exports = extensions => {
	const regex = new RegExp('\\.(' + _(extensions.split(/[^a-z0-9]+/gi)).compact().uniq().map(_.trim).join('|') + ')$', 'ig');
	
	return findFilesStart;

	function findFilesStart(allPaths) {
		if (_.isArray(allPaths)) {
			return Q.allSettled(_.map(allPaths, findFilesStart)).
				then(results => {
					return _(results).filter({
						state: 'fulfilled'
					}).map('value').flatten().uniq().value()
				}
				);
		}

		
		return findFiles(allPaths, []).
			then(filePaths => {
				return _.filter(filePaths, isValid);
			});
	}
	function isValid(filename) {
		return filename.match(regex);
	}
};

function findFiles(anyPath, list) {
	if (isDirectory(anyPath)) {
		return Defer(deferred => {
			fs.readdir(anyPath, (err, files) => { 
			    if (err) {
			    	deferred.resolve(list);
			    	return;
			    }
			    
			    Q.allSettled(_.map(files, file => findFiles(path.join(anyPath, file), list))).then(() => {
			    	deferred.resolve(list);
			    });
			});
		});
	}

	list.push(anyPath);

	return Q(list);
}
function isDirectory(anyPath) {
	return fs.lstatSync(anyPath).isDirectory();
}