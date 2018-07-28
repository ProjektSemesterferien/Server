
var invitationList = [];

class Invitation {

  constructor(receiverName, senderName, gameserver) {
    this.receiverName = receiverName;
    this.senderName = senderName;
    this.gameserver = gameserver;
  }
}

class InviteShort {

  constructor(invitation) {
    this.sender = invitation.senderName;
    this.ipAddress = invitation.gameserver.ipAddress;
    this.port = invitation.gameserver.port;
  }
}

exports.sendInvite = function(receiverName, senderName, gameserver) {
  invitationList.push(new Invitation(receiverName, senderName, gameserver));
  return true;
}

exports.getInvitesForUser = function(receiverName) {
  return new Promise((resolve, reject) => {
    if (receiverName === undefined || typeof receiverName !== 'string') {
      reject({ "err": "Wrong username"});
    }

    invites = [];
    for (i in invitationList) {
      if (invitationList[i] !== undefined && invitationList[i].receiverName === receiverName) {
        invites.push(new InviteShort(invitationList[i]));
        //TODO: Es werden Invites übersprungen, wenn andere entfernt werden
        invitationList.splice(i, 1);
      }
    }
    resolve(invites);
  });
}
