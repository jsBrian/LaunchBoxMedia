const electron = require('electron');
const {dialog, app, BrowserWindow} = electron;
const path = require('path');
const url = require('url');
const Globals = require('./scripts/Globals.json');

let win;

function createWindow() {
  win = new BrowserWindow({
	  width: 800,
	  height: 600,
    resizable: false
  });

  //win.setMenu(null);

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  win.on('closed', () => {
    win = null
  });
}

exports.selectMovieFiles = function () {
  return dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Movies',
        extensions: Globals.movieFileExtensions.split(/\s*,\s*/g)
      }
    ]
  });
}
exports.selectMovieDirectories = function () {
  return dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'multiSelections']
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
});