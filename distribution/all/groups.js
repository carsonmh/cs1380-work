const groups = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    put: (config, group, callback) => {
      const configuration = {service: 'groups', method: 'put'}
      distribution[context.gid].comm.send([config, group], configuration, (e, v) => {
        callback(e, v)
      })
    },

    del: (name, callback) => {
      const configuration = {service: 'groups', method: 'del'}
      distribution[context.gid].comm.send([name], configuration, (e, v) => {
        callback(e, v)
      })
    },

    get: (name, callback) => {
      const configuration = {service: 'groups', method: 'get'}
      distribution[context.gid].comm.send([name], configuration, (e, v) => {
        callback(e, v)
      })
    },

    add: (name, node, callback) => {
      const configuration = {service: 'groups', method: 'add'}
      distribution[context.gid].comm.send([name, node], configuration, (e, v) => {
        callback(e, v)
      })
    },

    rem: (name, node, callback) => {
      const configuration = {service: 'groups', method: 'rem'}
      distribution[context.gid].comm.send([name, node], configuration, (e, v) => {
        callback(e, v)
      })
    },
  };
};

module.exports = groups;
