const log = require('../util/log');
const serialization = require('../util/serialization');

const status = {};

global.moreStatus = {
  sid: global.distribution.util.id.getSID(global.nodeConfig),
  nid: global.distribution.util.id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function(configuration, callback) {
  callback = callback || function() { };
  // TODO: implement remaining local status items
  if(configuration == 'nid'){
    callback(null, global.moreStatus.nid);
    return;
  }
  if(configuration == 'sid') {
    callback(null, global.moreStatus.sid);
    return;
  }
  if(configuration == 'ip') {
    callback(null, global.nodeConfig.ip);
    return;
  }
  if(configuration == 'port') {
    callback(null, global.nodeConfig.port);
    return;
  }
  if(configuration == 'counts') {
    callback(null, global.moreStatus.counts);
    return;
  }
  if (configuration === 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
    return;
  }
  if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
    return;
  }
  // const obj1 = {"hello.com": {outgoing_links: ["hi.com", "bad.com"], text: "machine learning is amazing"}};
  // const obj2 = {"bye.com": {outgoing_links: ["hi.com", "bad.com"], text: "deep learning powers amazing systems"}};
  // const obj3 = {"gone.com": {outgoing_links: ["hi.com", "bad.com"], text: "machine learning and deep learning are related"}};
  // console.log(serialization.serialize(obj1));
  // console.log(serialization.serialize(obj2));
  // console.log(serialization.serialize(obj3));

  callback(new Error('Status key not found'));
};


status.spawn = function(configuration, callback) {
  // console.log(configuration, callback.toString())
  const status = require('@brown-ds/distribution').local.status
  status.spawn(configuration, callback)

};

status.stop = function(callback) {
  const status = require('@brown-ds/distribution').local.status
  // console.log("STOP WAS CALLED!!!!");
  status.stop(callback)
};

module.exports = status;
