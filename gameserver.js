var uuid = require('uuid');

var gameservers = [];

class GameServer {

  constructor(uuid, ipAddress, port) {
    this.uuid = uuid;
    this.ipAddress = ipAddress;
    this.port = port;
    this.reserved = false;
    this.ingame = false;
    this.lastSeen = new Date();
  }

  updateGameServer(reserved, ingame) {
    this.reserved = reserved;
    this.ingame = ingame;
    this.lastSeen = new Date();
  }

  isReady() {
    return !(this.reserved || this.ingame);
  }
};

exports.addGameServer = function(serverinfo) {
  if (typeof serverinfo.ipAddress !== 'string' || typeof serverinfo.port !== 'number') {
    return { "err": "Wrong parameters"};
  }

  if (isGameServerRegistered(serverinfo.ipAddress, serverinfo.port)) {
    return { "err": "Server with that IP-Address and Port already registered"};
  }

  serverId = uuid.v4();
  gameservers.push(new GameServer(serverId, serverinfo.ipAddress, serverinfo.port));
  return { "uuid": serverId };
}

exports.updateGameServer = function(serverId, serverInfo) {
  if (typeof serverInfo.reserved !== 'boolean' || typeof serverInfo.ingame !== 'boolean') {
    return { "err": "Wrong parameters"};
  }

  if ((server = getGameserverByServerId(serverId)) !== undefined) {
    server.updateGameServer(serverInfo.reserved, serverInfo.ingame);
    return { "success": "Updated Gameserver successfully"};
  } else {
    return { "err": "Unknown ServerID"};
  }
}

exports.deleteGameServer = function(serverId) {
  if ((pos = getGameserverPosByServerId(serverId)) >= 0) {
    gameservers.splice(pos, 1);
    return { "success": "Successfully deleted server with uuid: " + serverId};
  } else {
    return { "err": "Unknown ServerID"};
  }
}

exports.getReadyGameserver = function() {
	return new Promise((resolve, reject) => {
    for (server of gameservers) {
      if (server.isReady()) {
        server.reserved = true;
        resolve({ "ipAddress": server.ipAddress, "port": server.port});
      }
    }
    reject({ "err": "No ready server found"});
  });
}

exports.getGameServerByIpAddress = function(ipAddress, port) {
  return new Promise((resolve, reject) => {
    if (ipAddress === undefined || typeof ipAddress !== 'string'
        || port === undefined || typeof port !== 'number') {
      reject({ "err": "Wrong parameters"});
    }

    server = getGameServerByIpAddress(ipAddress, port);
    if (server === undefined) {
      reject({ "err": "No server with the given ipAddress and port"});
    }
    resolve(server);
  });
}

exports.doesGameserverExist = function(ipAddress, port) {
  return new Promise((resolve, reject) => {
    if (ipAddress === undefined || typeof ipAddress !== 'string'
        || port === undefined || typeof port !== 'number') {
      reject({ "err": "Wrong parameters"});
    }

    resolve({ "exists": (isGameServerRegistered(ipAddress, port))});
  });
}

function getGameserverByServerId(serverId) {
  for (server of gameservers) {
    if (server !== undefined) {
      if (server.uuid === serverId) {
        return server;
      }
    }
  }
  return undefined;
}

function getGameserverPosByServerId(serverId) {
  for (i = 0; i < gameservers.length; i++) {
    server = gameservers[i];
    if (server !== undefined) {
      if (server.uuid === serverId) {
        return i;
      }
    }
  }
  return -1;
}

function isGameServerRegistered(ipAddress, port) {
  for (server of gameservers) {
    if (server !== undefined) {
      if (server.ipAddress === ipAddress && server.port === port) {
        return true;
      }
    }
  }
  return false;
}

function getGameServerByIpAddress(ipAddress, port) {
  for (server of gameservers) {
    if (server !== undefined) {
      if (server.ipAddress === ipAddress && server.port === port) {
        return server;
      }
    }
  }
  return undefined;
}
