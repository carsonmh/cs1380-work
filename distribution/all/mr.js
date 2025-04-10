/** @typedef {import("../types").Callback} Callback */

const id = require('../util/id')
const fs = require('fs');
const path = require('path');

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {any} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
 * @param {any} key
 * @param {Array} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 */


/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/

function mr(config) {
  const context = {
    gid: config.gid || 'all',
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} cb
   * @return {void}
   */
  function exec(configuration, cb) {
    let count = 0
    function notify(obj, cb) {

      function operatorSync(obj, cb) {
        const operatorNode = obj.node
        obj.operation = 'worker_sync'
        obj.node = distribution.node.config
        distribution.local.comm.send([obj], { node: operatorNode, service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
          cb(null, null)
        })
      }

      function workerSync(obj, cb) {
        const memberAmount = 3 // TODO: don't hardcode this value
        count += 1
        if(count == memberAmount){ 
          count = 0
          distribution.local.groups.get(obj.gid, (e, group) => {
            if(e) {
              cb(e, null)
              return
            }

            const keys = configuration.keys
            let nodeToKeys = {}

            for(const key of Object.keys(group)) {
              nodeToKeys[key] = []
            }

            for (const key of keys) {
              const node = id.consistentHash(id.getID(key), Object.keys(group))
              if (nodeToKeys[node]) {
                nodeToKeys[node].push(key)
              }
            }

            let counter = 0

            const total = Object.keys(nodeToKeys).length

            for (const [key, value] of Object.entries(nodeToKeys)) {
              const object = { keys: value, node: distribution.node.config, serviceNames: obj.serviceNames, operation: 'start_map', gid: obj.gid }
              const remote = { node: group[key], service: obj.serviceNames.notifyServiceName, method: 'notify' }
              distribution.local.comm.send(
                [object], remote, (e, v) => {
                  counter += 1
                  if (counter == total) {
                    cb(null, null)
                  }
                })
              }
            })
          }else {
            cb(null, null)
          }
      }

      function startMap(obj, cb) {
        let arr = []
        let counter = 0
        let total = obj.keys.length
        if(obj.keys.length == 0){ 
          distribution.local.store.put([], { key: 'mappedValues', gid: obj.gid }, (e, v) => {
            const operatorNode = obj.node
            obj.operation = 'map_sync'
            obj.node = distribution.node.config
            distribution.local.comm.send([obj], { node: operatorNode, service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
              cb(null, null)
            })
          })
          return
        }

        for (const key of obj.keys) {
          distribution.local.store.get({ gid: obj.gid, key: key }, (e, data) => {
            distribution.local.store.del({ gid: obj.gid, key: key }, (e, result) => {
            distribution.local.routes.get(obj.serviceNames.mapServiceName, (e, returnedService) => {
              const result = returnedService.map(key, data)
              if(Array.isArray(result)) {
                arr = arr.concat(result)
              }else {
                arr.push(result)
              }
              counter += 1

              if (counter == total) {
                distribution.local.store.put(arr, { key: 'mappedValues', gid: obj.gid }, (e, v) => {
                  const operatorNode = obj.node
                  obj.operation = 'map_sync'
                  obj.node = distribution.node.config
                  distribution.local.comm.send([obj], { node: operatorNode, service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
                    cb(null, null)
                  })
                })
              }
            })
          })
          })
        }
      }

      function mapSync(obj, cb) {
        const memberAmount = 3
        count += 1
        if(count == memberAmount){ 
          count = 0
          distribution[obj.gid].comm.send(
            [{ gid: obj.gid, hash: id.consistentHash, node: distribution.node.config, serviceNames: obj.serviceNames, operation: 'start_shuffle' }],
            { service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
              cb(null, null)
            })
        }else {
          cb(null, null)
        }
      }

      function shuffleSync(obj, cb) {
        const memberAmount = 3
        count += 1
        if(count == memberAmount){ 
          count = 0

          distribution[obj.gid].comm.send(
            [{ gid: obj.gid, node: distribution.node.config, serviceNames: obj.serviceNames, operation: 'start_reduce' }],
            { service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
              cb(null, null)
            })
        }else {
          cb(null, null)
        }
      }

      function reduceSync(obj, cb) {
        const memberAmount = 3
        count += 1
        if(count == memberAmount){ 
          count = 0
          cb(null, null)
        }else {
          cb(null, null)
        }
      }

      function callShuffle(obj, cb) {
        distribution.local.routes.get(obj.serviceNames.shuffleServiceName, (e, returnedService) => {
          returnedService.shuffle(obj, (e, v) => {
            const operatorNode = obj.node
            obj.operation = 'shuffle_sync'
            obj.node = distribution.node.config
            distribution.local.comm.send([obj], { node: operatorNode, service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
              cb(null, null)
            })
          })
        })
      }

      function startReduce(obj, cb) {
        distribution.local.mem.get({key: null, gid: obj.gid}, (e, keys) => {
          let map = {}
          let i = 0
          if(keys.length == 0) {
            const res = []
            distribution.local.store.put(res, { key: 'result', gid: obj.gid }, (e, v) => {
              const operatorNode = obj.node
              obj.operation = 'reduce_sync'
              obj.node = distribution.node.config
              distribution.local.comm.send([obj], { node: operatorNode, service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
                cb(null, null)
              })
            })
            return
          }

          for(const key of keys) {
            distribution.local.mem.get({key: key, gid: obj.gid}, (e, v) => {
              i += 1
              const item = key.split(' ')[0]
              if(map[item]) {
                map[item].push(v[item])
              }else {
                map[item] = [v[item]]
              }

              if(i == keys.length) {
                let res = []
                distribution.local.routes.get(obj.serviceNames.reduceServiceName, (e, returnedService) => {
                  for(const [key, value] of Object.entries(map)){ 
                    const output = returnedService.reduce(key, value)
                    res.push(output)
                  }

                  distribution.local.store.put(res, { key: 'result', gid: obj.gid }, (e, v) => {
                    const operatorNode = obj.node
                    obj.operation = 'reduce_sync'
                    obj.node = distribution.node.config
                    distribution.local.comm.send([obj], { node: operatorNode, service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
                      cb(null, null) // TEMP
                    })
                  })
                })
              }
            })
          }
        })
      }

      switch (obj.operation) {
        case "operator_sync":
          operatorSync(obj, cb)
          break
        case "worker_sync":
          workerSync(obj, cb)
          break
        case "start_map":
          startMap(obj, cb)
          break
        case "map_sync":
          mapSync(obj, cb)
          break
        case "start_shuffle":
          callShuffle(obj, cb)
          break
        case "shuffle_sync":
          shuffleSync(obj, cb)
          break
        case "start_reduce":
          startReduce(obj, cb)
          break
        case "reduce_sync":
          reduceSync(obj, cb)
          break
        default:
          throw new Error("There shouldn't be a default call here")
      }
    }

    function shuffle(obj, cb) {
      const id = require('../util/id')
      distribution.local.groups.get(obj.gid, (e, group) => {
        distribution.local.store.get({gid: obj.gid, key: 'mappedValues'}, (e, mappedValues) => {
          distribution.local.store.del({gid: obj.gid, key: 'mappedValues'}, (e, res) => {
            if(mappedValues.length == 0) {
              cb(null, null)
              return
            }
            let i = 0

            let idVar = 0
            for(const mapping of mappedValues){ 
              idVar += 1
              const nodePort = distribution.node.config.port
              const key = Object.keys(mapping)[0] + ' ' + nodePort  + idVar
              const kid = Object.keys(mapping)[0]
              const node = id.consistentHash(id.getID(kid), Object.keys(group))
              const remote = {node: group[node], service: "mem", method: "put"}
                distribution.local.comm.send([mapping, {key: key, gid: obj.gid}], remote, (e, v) => {
                  i += 1
                  if(i == mappedValues.length) {
                    cb(null, null)
                  }
                })

                // TODO: send these in a batch instead of one at a time
              }
            })
          })
        })
    }


    distribution.local.count = 0

    const notifyServiceName = 'mr-' + id.getID(notify.toString())
    const mapServiceName = 'mr-' + id.getID(configuration.map.toString())
    const reduceServiceName = 'mr-' + id.getID(configuration.reduce.toString())
    const shuffleServiceName = 'mr-' + id.getID(shuffle.toString())
    const serviceNames = {
      notifyServiceName,
      mapServiceName,
      reduceServiceName,
      shuffleServiceName
    }

    const notifyService = { notify: notify }
    const mapService = { map: configuration.map }
    const reduceService = { reduce: configuration.reduce }
    const shuffleService = { shuffle: shuffle }

    distribution.local.routes.put(notifyService, notifyServiceName, (e, v) => {
      distribution[context.gid].routes.put(notifyService, notifyServiceName, (e, v) => {
        distribution[context.gid].routes.put(mapService, mapServiceName, (e, v) => {
          distribution[context.gid].routes.put(reduceService, reduceServiceName, (e, v) => {
            distribution[context.gid].routes.put(shuffleService, shuffleServiceName, (e, v) => {
              distribution.local.groups.get(context.gid, (e, group) => {
              distribution[context.gid].comm.send(
                [{gid: context.gid, node: distribution.node.config, serviceNames: serviceNames, operation: 'operator_sync'}],
                {service: notifyServiceName, method: 'notify'}, 
                (e, v) => {
                  let iterator = 0
                  let arr = []
                  for(const key of Object.keys(group)) {
                    const node = group[key]
                    const remote = {node: node, service: 'store', method: 'get'}
                    const params = [{gid: context.gid, key: 'result'}]
                    distribution.local.comm.send(params, remote, (e, v) => {
                      const remote2 = {node: node, service: 'store', method: 'del'}
                      const params2 = [{gid: context.gid, key: 'result'}]
                      distribution.local.comm.send(params2, remote2, (e, v) => {
                        iterator += 1
                        arr = arr.concat(v)
                        if(iterator == Object.keys(group).length) {
                          cb(null, arr)
                        }
                      })
                    })
                  }
                })
                })
              })
            })
          })
        })
      })
    }

  return { exec };
};

module.exports = mr;
