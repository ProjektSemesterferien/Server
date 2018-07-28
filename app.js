var express = require('express');
var bodyParser = require('body-parser');
var persistence = require('./persistence');
var config = require('./config')
var gameserver = require('./gameserver');
var invite = require('./invite');

var app = express();

app.use(bodyParser.json());

///////////////////////////////////////////////////////
//	Authentication
///////////////////////////////////////////////////////
app.post('/register', (req, res) => {
	persistence.registerPlayer(req.body).then(
		function(data) {
			res.send(data);
		}).catch(
		function(err) {
			res.status(400).send(err);
		});
});

app.put('/login', (req, res) => {
	persistence.loginPlayer(req.body).then(
		function(data) {
			res.send(data);
		}).catch(
		function(err) {
			res.status(400).send(err);
		});
});

app.delete('/logout', (req, res) => {
	persistence.logoutPlayer(req.query.apikey).then(
		function(data) {
			res.send(data);
		}).catch(
		function(err) {
			res.status(400).send(err);
		});
});

///////////////////////////////////////////////////////
//	User Info
///////////////////////////////////////////////////////
app.get('/user/:userId', (req, res) => {
	persistence.getPlayerInfo(req.params.userId, req.query.apikey).then(
		function(data) {
			res.send(data);
		}).catch(
		function(err) {
			res.status(400).send(err);
		});
});

app.put('/user/image', (req, res) => {
	persistence.setPlayerImage(req.body.imageId, req.query.apikey).then(
		function(data) {
			res.send(data);
		}).catch(
		function(err) {
			res.status(400).send(err);
		});
});

///////////////////////////////////////////////////////
//	Server
///////////////////////////////////////////////////////
app.put('/game/create', (req, res) => {
	persistence.checkForValidApikey(req.query.apikey).then(
		function(data) {
			gameserver.getReadyGameserver().then(
				function(data) {
					res.send(data);
				}).catch(
				function(err) {
					res.status(400).send(err);
				});
		}).catch(function(err) {
			res.status(400).send(err);
		});
});

app.post('/game/invite', (req, res) => {
	persistence.checkForValidApikey(req.query.apikey).then(
		function(data) {
			persistence.getUserInfoFromApiKey(req.query.apikey).then(
				function(data) {
					username = data.username;
					persistence.doesUsernameExist(req.body.username).then(
						function(data) {
							gameserver.getGameServerByIpAddress(req.body.ipAddress, req.body.port).then(
								function(data) {
									if (data === undefined) {
										res.status(400).send({ "err": "No server with that ipAddress and port"});
										return;
									}

									invite.sendInvite(req.body.username, username, data);
									res.send({ "success": "Added user to invite list"});
							}).catch(
							function(err) {
								res.status(400).send(err);
							});
					}).catch(
					function(err) {
						res.status(400).send(err);
					});
				}).catch(
				function(err) {
					res.status(400).send(err);
				});
		}).catch(
		function(err) {
			res.status(400).send(err);
		});
});

app.get('/game/invite', (req, res) => {
	persistence.checkForValidApikey(req.query.apikey).then(
		function(data) {
			persistence.getUserInfoFromApiKey(req.query.apikey).then(
				function(data) {
					invite.getInvitesForUser(data.username).then(
						function(data) {
							res.send(data);
					}).catch(function(err) {
						res.status(400).send(err);
					});
			}).catch(
			function(err) {
				res.status(400).send(err);
			})
	}).catch(
	function(err) {
		res.status(400).send(err);
	});
});

///////////////////////////////////////////////////////
//	Server
///////////////////////////////////////////////////////
app.post('/server/register', (req, res) => {
	if (config.isAllowedServerOrigin(req.connection.remoteAddress)) {
		result = gameserver.addGameServer(req.body);
		if (result.err !== undefined) {
				res.status(400).send(result);
		} else {
			res.send(result);
		}
	} else {
			res.status(400).send({ "err": "Remote Address " + req.connection.remoteAddress + " not allowed to register a server"});
	}
});

app.put('/server/update/:serverId', (req, res) => {
	if (config.isAllowedServerOrigin(req.connection.remoteAddress)) {
		result = gameserver.updateGameServer(req.params.serverId, req.body);
		if (result.err !== undefined) {
				res.status(400).send(result);
		} else {
			res.send(result);
		}
	} else {
			res.status(400).send({ "err": "Remote Address not allowed to update a server"});
	}
});

app.delete('/server/unregister/:serverId', (req, res) => {
	if (config.isAllowedServerOrigin(req.connection.remoteAddress)) {
			result = gameserver.deleteGameServer(req.params.serverId);
			if (result.err !== undefined) {
					res.status(400).send(result);
			} else {
				res.send(result);
			}
	} else {
			res.status(400).send({ "err": "Remote Address not allowed to delete a server"});
	}
});

///////////////////////////////////////////////////////
//	Main
///////////////////////////////////////////////////////
app.listen(3000, () => {
	console.log('Initializing WizardWar Master Server');
	config.loadConfig().then(function(data) {
		if ( persistence.setupDatabase(config.getDatabase())) {
			console.log('WizardWar authentication server listening on port 3000!');
		}
	}).catch(function(err) {
		console.log(err);
	});
});
