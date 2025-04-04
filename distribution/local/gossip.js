const gossip = {};
const comm = require('./comm');
const messages = new Set();

gossip.recv = function(payload, callback) {
  callback = callback || function() { };
  const message = payload.message;
  const remote = payload.remote;
  const mess_ID = payload.mid;
  const group_ID = payload.gid;
  console.log("here is the payload");
  console.log(payload);

  // check if recieved message
  if (mess_ID in messages) {
    callback(new Error('Message recieved already'));
    return;
  }

  messages.add(mess_ID);

  // send to all in grp
  global.distribution[group_ID].gossip.send(message, remote);

  // send to myself
  const node = {
    ip: global.nodeConfig.ip,
    port: global.nodeConfig.port,
  };

  comm.send(message, node, (err, response) => {
    if (err) {
      callback(err);
    } else {
      callback(null, response);
    }
  });
};

module.exports = gossip;
