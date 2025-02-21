const status = function(config) {
  const context = {};
  context.gid = config.gid || 'all';
  return {
    get: (configuration, callback) => {
      distribution[context.gid].comm.send([configuration], {service: "status", method: "get"}, (e, v) => {
        if(configuration == 'counts' || configuration == 'heapTotal' || configuration == 'heapUsed') {
          let aggregatedResult = 0
          for(const [key, value] of Object.entries(v)) {
            aggregatedResult += value
          }

          callback(e, {'total': aggregatedResult})
        }else {
          callback(e, v)
        }
      })
    },

    spawn: (configuration, callback) => {
      distribution[context.gid].comm.send([configuration], {service: "status", method: "spawn"}, (e, v) => {
        callback(e, v)
      })
    },

    stop: (callback) => {
      distribution[context.gid].comm.send([], {service: "status", method: "stop"}, (e, v) => {
        callback(e, v)
      })
    },
  };
};

module.exports = status;
