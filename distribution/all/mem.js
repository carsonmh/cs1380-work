const id = require('../util/id')

function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;

  /* For the distributed mem service, the configuration will
          always be a string */
  return {
    get: (configuration, callback) => {
      if(configuration == null) {
        distribution[context.gid].comm.send([{gid: context.gid, key: null}], {service: 'mem', method: 'get'}, (e, v) => {
          callback(e, v)
        })
        return
      }

      const kid = typeof configuration == 'string' && configuration.length == 64 ? configuration : id.getID(configuration)
      distribution.local.groups.get(context.gid, (e, group) => {
        if(e) {
          callback(e, null)
          return
        }
        const node = id.rendezvousHash(kid, Object.keys(group))
        const remote = { node: group[node], service: 'mem', method: 'get'}
        distribution.local.comm.send([{key: configuration, gid: context.gid}], remote, (e, v) => {
          if(e) {
            callback(e, null)
            return
          }
          callback(null, v)
        })
      })
    },

    put: (state, configuration, callback) => {
      const kid = configuration ? id.getID(configuration) : id.getID(state)
      distribution.local.groups.get(context.gid, (e, group) => {
        if(e) {
          callback(e, null)
          return
        }
        const node = id.rendezvousHash(kid, Object.keys(group))
        // ECONNREFUSED: because the node config is wrong
        const remote = { node: group[node], service: 'mem', method: 'put'}
        distribution.local.comm.send([state, {key: configuration, gid: context.gid}], remote, (e, v) => {
          if(e) {
            callback(e, null)
            return
          }
          callback(null, v)
        })
      })
    },

    del: (configuration, callback) => {
      const kid = typeof configuration == 'string' && configuration.length == 256 ? configuration : id.getID(configuration)
      distribution.local.groups.get(context.gid, (e, group) => {
        if(e) {
          callback(e, null)
          return
        }
        const node = id.rendezvousHash(kid, Object.keys(group))
        const remote = { node: group[node], service: 'mem', method: 'del'}
        distribution.local.comm.send([{key: configuration, gid: context.gid}], remote, (e, v) => {
          if(e) {
            callback(e, null)
            return
          }
          callback(null, v)
        })
      })
    },

    reconf: (configuration, callback) => {
     
    },
  };
};

module.exports = mem;
