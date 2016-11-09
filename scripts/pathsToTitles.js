'use strict';

const _ = require('lodash');
const Globals = require('./Globals.json');
const path = require('path');

const findFiles = require('./findFiles.js')(Globals.movieFileExtensions);
const GuessIt = require('guessit-wrapper');
const LaunchBox = require('./LaunchBox.js');
const allCalls = require('./allCalls.js');

const TYPE_MAP = {
  tv: 'episode',
  movie: 'movie'
};

module.exports = (Settings, platform, allPaths, mediaType) => {
  const LAUNCHBOX_PATH = Settings.launchBoxDir;

  LaunchBox.setDirectory(LAUNCHBOX_PATH);

  const gamePaths = LaunchBox.getGamePaths(platform);
  mediaType = TYPE_MAP[mediaType]; // else undefined, which is OK

  return findFiles(allPaths).then(filePaths => {
    filePaths = _.filter(filePaths, filePath => gamePaths.indexOf(filePath) < 0);

    return allCalls(_.map(filePaths, filePath => () => GuessIt.apiCall('/guess', {
      filename: _.last(filePath.split(path.sep)),
      type: mediaType
    }).then(movieData => {
      return {
        filePath: filePath,
        guess: {
          title: movieData.title,
          year: movieData.year,
          series: movieData.series,
          season: movieData.season,
          episodeNumber: movieData.episodeNumber
        }
      };
    })));
  });
};
