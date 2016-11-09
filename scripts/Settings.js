const SETTINGS_PATH = __dirname + '/Settings.json';

const fs = require('fs');

module.exports = Object.freeze({
	load: () => {
		try {
			return require(SETTINGS_PATH);
		} catch(e) {}
		return {};
	},
	store: Settings => {
		fs.writeFile(SETTINGS_PATH, JSON.stringify(Settings), 'utf8');
	}
});