'use strict';

const fs = require('fs');
const path = require('path');

const xmlToJson = require('./xmlToJson.js');
const jsonToXml = require('./jsonToXml.js');

let launchBoxDir;
let jsonEmulators;
let jsonPlatforms;
let jsonGames = {};

const platformFolders = ['Box - Front', 'Box - Front - Reconstructed', 'Box - Back', 'Box - Back - Reconstructed', 'Box - 3D', 'Advertisement Flyer - Front', 'Advertisement Flyer - Back', 'Arcade - Cabinet', 'Arcade - Circuit Board', 'Arcade - Control Panel', 'Arcade - Controls Information', 'Arcade - Marquee', 'Banner', 'Cart - Front', 'Cart - Back', 'Cart - 3D', 'Clear Logo', 'Disc', 'Fanart - Box - Front', 'Fanart - Box - Back', 'Fanart - Cart - Front', 'Fanart - Cart - Back', 'Fanart - Background', 'Fanart - Disc', 'Screenshot - Gameplay', 'Screenshot - Game Title', 'Screenshot - Game Select', 'Screenshot - Game Over', 'Screenshot - High Scores', 'Steam Banner'];
const CHAR_ENC = 'utf8';

module.exports = Object.freeze({
  setDirectory: setDirectory,
  getEmulators: getEmulators,
  getGamePaths: getGamePaths,
  addGame: addGame,
  addPlatform: addPlatform,
  safeTitle: safeTitle
});

function safeTitle(title) {
  return title.replace(/\s*\:\s*/g, ' - ');
}
function addPlatform(name) {
  let platforms = getPlatforms();
  let isAvailable = _.indexOf(platforms, name) >= 0;

  if (isAvailable) {
    return;
  }

  jsonPlatforms.LaunchBox.Platform.push(createPlatformJSON(name));

  _.forEach(platformFolders, platformFolder => {
    jsonPlatforms.LaunchBox.PlatformFolder.push(createImagePlatformFolderJSON(name, platformFolder));
  });
  jsonPlatforms.LaunchBox.PlatformFolder.push(createPlatformFolderJSON(name, 'Video', 'Videos'));
  jsonPlatforms.LaunchBox.PlatformFolder.push(createPlatformFolderJSON(name, 'Manual', 'Manuals'));
  jsonPlatforms.LaunchBox.PlatformFolder.push(createPlatformFolderJSON(name, 'Music', 'Music'));

  storePlatforms();
}
function addGame(o) {
  getJsonGamePaths(o.platform).LaunchBox.Game.push(createGameJSON(o));

  storeGames(o.platform);
}
function createGameJSON(o) {
  return {
    ApplicationPath: o.filePath,
      Completed: 'false',
      DateAdded: getNowDateTime(),
      DateModified: getNowDateTime(),
      Developer: '',
      Emulator: o.emulator,
      Favorite: 'false',
      ID: randomID(),
      Notes: o.description,
      Platform: o.platform,
      Publisher: '',
      Rating: '',
      ReleaseDate: o.releaseDate + 'T00:00:00' + timezoneOffset(),
      ScummVMAspectCorrection: 'false',
      ScummVMFullscreen: 'false',
      StarRating: o.stars + '',
      Status: o.status,
      Title: o.title,
      UseDosBox: 'false',
      UseScummVM: 'false',
      PlayMode: '',
      Region: '',
      PlayCount: '0',
      Portable: 'false',
      Hide: 'false',
      Broken: 'false',
      Genre: o.genres
  };
}
function getJsonGamePaths(platform) {
  if (!jsonGames[platform]) {
    jsonGames[platform] = getJson('Platforms', platform + '.xml');
    jsonMakeArray(jsonGames[platform], 'Game');
  }

  return jsonGames[platform];
}
function getGamePaths(platform) {
  return _.map(getJsonGamePaths(platform).LaunchBox.Game, 'ApplicationPath');
}
function storeGames(platform) {
  storeJSON(getJsonGamePaths(platform), 'Platforms', platform + '.xml');
}
function storePlatforms() {
  storeJSON(jsonPlatforms, 'Platforms.xml');
}
function storeJSON() {
  let args = Array.prototype.slice.call(arguments, 0);
  let json = args.shift();
  let filePath = getDataPath.apply(null, args);

  fs.writeFile(filePath, jsonToXml(json), CHAR_ENC);
}
function jsonMakeArray(json, field) {
  _.set(json, 'LaunchBox.' + field, asArray(_.get(json, 'LaunchBox.' + field)));
}
function getDataPath() {
  return path.join.apply(null, Array.prototype.concat.apply([launchBoxDir, 'Data'], arguments));
}
function getJson() {
  let filePath = getDataPath.apply(null, arguments);

  try {
    return xmlToJson(fs.readFileSync(filePath, CHAR_ENC));
  }
  catch(e) {}

  return {};
}
function setDirectory(dir) {
  if (launchBoxDir === dir) {
    return;
  }
  launchBoxDir = dir;
  jsonEmulators = undefined;
  jsonPlatforms = undefined;
  jsonGames = {};
}
function asArray(o) {
  if (_.isUndefined(o)) {
    return [];
  }
  if (_.isArray(o)) {
    return o;
  }
  return [o];
}
function createPlatformJSON(name) {
  return {
    LocalDbParsed: 'true',
    Name: name,
    Developer: '',
    Manufacturer: '',
    Cpu: '',
    Memory: '',
    Graphics: '',
    Sound: '',
    Display: '',
    Media: '',
    MaxControllers: '',
    Folder: '',
    Notes: '',
    VideoPath: ''
  };
}
function createPlatformFolderJSON(name, type, filePath) {
  return {
    MediaType: type,
    FolderPath: path.join.apply(null, [filePath, name]),
    Platform: name
  };
}
function createImagePlatformFolderJSON(name, type) {
  return {
    MediaType: type,
    FolderPath: path.join.apply(null, ['Images']),
    Platform: name
  };
}
function getJsonPlatforms() {
  if (!jsonPlatforms) {
    jsonPlatforms = getJson('Platforms.xml');
    jsonMakeArray(jsonPlatforms, 'Platform');
    jsonMakeArray(jsonPlatforms, 'PlatformFolder');
  }

  return jsonPlatforms;
}
function getPlatforms() {
  return _.map(getJsonPlatforms().LaunchBox.Platform, 'Name');
}
function getJsonEmulators() {
  if (!jsonEmulators) {
    jsonEmulators = getJson('Emulators.xml');
    jsonMakeArray(jsonEmulators, 'Emulator');
  }

  return jsonEmulators;
}
function getEmulators() {
  return _.map(getJsonEmulators().LaunchBox.Emulator, emulator => {
    return {
      text: emulator.Title,
      value: emulator.ID
    };
  });
}


function randomID() {
  return [randomChars(8), randomChars(4), randomChars(4), randomChars(4), randomChars(12)].join('-');
}
function randomChars(length) {
  let s = '';

  for (; length > 0; length -= 1) {
    s += randomChar();
  }

  return s;
}
function randomChar() {
  return (Math.random() * 16 << 0).toString(16);
}
function getNowDateTime() {
  return (new Date()).toISOString().slice(0, 23) + timezoneOffset();
}
function timezoneOffset() {
  let d = new Date();
  d = -d.getTimezoneOffset() / 60;
  let s;

  if (d < 0) {
    s = '-';
    d = -d;
  } else {
    s = '+';
  }

  if (d < 10) {
    s += '0';
  }
  s += (d << 0) + ':';
  d = (d - (d << 0)) * 60;

  if (d < 10) {
    s += '0';
  }

  return s + d;
}