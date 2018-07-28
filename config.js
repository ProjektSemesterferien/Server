var fileStream = require('fs');

var configPath = './config.json';

var config;

exports.loadConfig = function() {
  return new Promise((resolve, reject) => {
    fileStream.readFile(configPath, (err, data) => {
      if (err) {
        reject({ "err": "ERROR: Cannot load config file\nYou need a file called 'config.json' in the server root directory\n" + err });
      }
      config = JSON.parse(data.toString());
      resolve(data);
    });
  });
};

exports.getDatabase = function() {
  if (config === undefined) {
    return undefined;
  }
  return config.database;
};

exports.getAllowedServerOrigins = function() {
  if (config === undefined) {
    return undefined;
  }
  return config.allowedGameServerOrigins;
}

exports.isAllowedServerOrigin = function(serverOrigin) {
  if (config === undefined) {
    return false;
  }

  for (allowedOrigin of config.allowedGameServerOrigins) {
    if (allowedOrigin === serverOrigin) {
      return true;
    }
  }
  return false;
}
