var mysql = require('mysql');
var bcrypt = require('bcrypt');
var uuid = require('uuid');

var con;

var sql_register = 'INSERT INTO user (username, email, passwordHash) VALUES (?, ?, ?)';
var sql_login = 'SELECT id, passwordHash FROM user WHERE username = ?';
var sql_logout = "DELETE FROM apikey WHERE apikey = ?";
var sql_apikeyInsert = 'INSERT INTO apikey (apikey, user_id) VALUES (?, ?)';
var sql_playerInfo = 'SELECT username, imageId FROM user WHERE id = ?';
var sql_validApikey = 'SELECT apikey, createdAt FROM apikey WHERE apikey = ?';
var sql_userIdFromApikey = 'SELECT user_id FROM apikey WHERE apikey = ?';
var sql_updateImage = 'UPDATE user SET imageID = ? WHERE id = ?';
var sql_userByUsername = 'SELECT id, username FROM user WHERE username = ?';

var millisPerDay = (1000 * 60 * 60 * 24);

exports.setupDatabase = function(dbData) {
	con = mysql.createConnection(dbData);
	con.connect(function(err) {
		if (err)
			return false;
		console.log("Successfully connected to Database");
	});
	return true
};

exports.registerPlayer = function(data) {
	return new Promise((resolve, reject) => {
		if (data === undefined) {
			reject({ "err": "Data is undefined"});
		}

		if (data.username === undefined ||
				data.email === undefined ||
				data.password === undefined) {
			reject({ "err": "Registration Data uncorrect"})
		}

		var passwordHash = bcrypt.hashSync(data.password, 8);
  	con.query(sql_register, [data.username, data.email, passwordHash], (err, results) => {
			if (err) {
				reject({ "err": err});
			}
			resolve({ "success": "Successfully registered user"});
		});
	});
};

exports.loginPlayer = function(data) {
	return new Promise((resolve, reject) => {
		if (data === undefined) {
			reject({ "err": "Data is undefined"});
		}

		if (data.username === undefined ||
				data.password === undefined) {
			reject({ "err": "Registration Data uncorrect"})
		}

		con.query(sql_login, [data.username], (err, results) => {
			if (err || results[0] === undefined) {
				reject({ "err": "Wrong email or password"});
			}

			if (bcrypt.compareSync(data.password, results[0].passwordHash)) {
				var apikey = uuid.v4();
				con.query(sql_apikeyInsert, [apikey, results[0].id], (err, results) => {
					if (err) {
						reject({ "err": err});
					}
					resolve({ "apikey": apikey});
				});
			} else {
				reject({ "err": "Wrong email or password"});
			}
		});
	});
};

exports.logoutPlayer = function(apikey) {
	return new Promise((resolve, reject) => {
		checkForValidApikey(apikey).then(function(data) {
			con.query(sql_logout, [apikey], (err, results) => {
				if (err) {
					reject({ "err": err});
				}
				resolve({ "success": "Logged out successfully"});
			});
		}).catch(function(err) {
			reject(err);
		});
	});
};

exports.getPlayerInfo = function(playerId, apikey) {
	return new Promise((resolve, reject) => {
		if (apikey === undefined) {
			reject({ "err": "apikey is undefined"})
		}

		if (playerId === undefined) {
			reject({ "err": "playerId is undefined"});
		}

		if (playerId < 0) {
			reject({ "err": "playerId must be positive"});
		}

		checkForValidApikey(apikey).then(function(data) {
			con.query(sql_playerInfo, [playerId], (err, results) => {
				if (err) {
					reject({ "err": err});
				}
				if (results[0] === undefined) {
					reject({ "err": "No player with ID " + playerId + " found"});
				}

				resolve(results[0]);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
};

exports.setPlayerImage = function(imageId, apikey) {
	return new Promise((resolve, reject) => {
		checkForValidApikey(apikey).then(function(data) {
			if (imageId === undefined || typeof imageId === 'number' || imageId < 0 || !Number.isInteger(imageId)) {
				reject({ "err": "Wrong imageId"});
			}

			getUserIdFromApikey(apikey).then(function(data) {
				con.query(sql_updateImage, [imageId, data.user_id], (err, results) => {
					if (err) {
						reject(err);
					}
					resolve({ "success": "Updated imageId to " + imageId});
				});
			}).catch(function(err) {
				reject(err);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
};

exports.getUserInfoFromApiKey = function(apikey) {
	return new Promise((resolve, reject) => {
		if (apikey === undefined || typeof apikey !== 'string') {
			reject({ "err": "Wrong apikey"});
		}

		getUserIdFromApikey(apikey).then(function(data) {
			con.query(sql_playerInfo, [data.user_id], (err, results) => {
				if (err) {
					reject({ "err": err});
				}
				if (results[0] === undefined) {
					reject({ "err": "No player with ID " + playerId + " found"});
				}

				resolve(results[0]);
			});
		}).catch(function(err) {
			reject(err);
		})
	});
}

exports.doesUsernameExist = function(username) {
	return new Promise((resolve, reject) => {
		if (username === undefined || typeof username !== 'string') {
			reject({ "err": "Wrong username"});
		}

		con.query(sql_userByUsername, [username], (err, results) => {
			if(err) {
				reject({ "err": err});
			}

			exists = (results[0] !== undefined);
			resolve({ "exists": exists});
		});
	});
}

exports.checkForValidApikey = function(apikey) {
	return new Promise((resolve, reject) => {
		checkForValidApikey(apikey).then(function(data) {
			resolve(data);
		}).catch(function(err) {
			reject(err);
		});
	});
}

function getUserIdFromApikey(apikey) {
	return new Promise((resolve, reject) => {
		con.query(sql_userIdFromApikey, [apikey], (err, results) => {
			if (err) {
				reject({ "err": err});
			}

			if (results[0] === undefined || results[0].user_id === undefined) {
				reject({ "err": "Unknown apikey"});
			}

			resolve(results[0]);
		});
	});
}

function checkForValidApikey(apikey) {
	return new Promise((resolve, reject) => {
		con.query(sql_validApikey, [apikey], (err, results) => {
			if (err) {
				reject({ "err": err});
			}

			if (results[0] === undefined || results[0].apikey === undefined) {
				reject({ "err": "Unknown apikey"});
			}

			now = new Date();
			if (((now - results[0].createdAt) / millisPerDay) >= 1) {
				reject({ "err": "apikey is no longer valid"});
			}

			resolve({ "success": "Valid apikey"});
		});
	});
}
