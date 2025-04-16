/** @typedef {import("../types").Callback} Callback */

const id = require('../util/id')
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
        const memberAmount = obj.memberCount // TODO: don't hardcode this value
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
            if (keys.length == 1 && (keys[0] == 'urls' || keys[0] == 'indexer')) {
              for(const key of Object.keys(group)) { 
                nodeToKeys[key] = [keys[0]]
              }
            } else {
              for(const key of Object.keys(group)) {
                nodeToKeys[key] = []
              }
  
              for (const key of keys) {
                const node = id.consistentHash(id.getID(key), Object.keys(group))
                if (nodeToKeys[node]) {
                  nodeToKeys[node].push(key)
                }
              }
            }

            let counter = 0

            const total = Object.keys(nodeToKeys).length

            for (const [key, value] of Object.entries(nodeToKeys)) {
              const object = { memberCount: obj.memberCount, keys: value, node: distribution.node.config, serviceNames: obj.serviceNames, operation: 'start_map', gid: obj.gid }
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
          } else {
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

        function go(cb) {
          for (const key of obj.keys) {
            distribution.local.store.get({ gid: obj.gid, key: key }, (e, data) => {
              distribution.local.store.del({ gid: obj.gid, key: key }, (e, result) => {
                distribution.local.routes.get(obj.serviceNames.mapServiceName, (e, returnedService) => {
                  returnedService.map(key, data).then(result => {
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
            })
          }
          // if there is no data -> could be the case in the indexer after we have no urls left (?)
          if (obj.keys.length == 0) {
            const arr = [];
            distribution.local.store.put(arr, { key: 'mappedValues', gid: obj.gid }, (e, v) => {
              const operatorNode = obj.node
              obj.operation = 'map_sync'
              obj.node = distribution.node.config
              distribution.local.comm.send([obj], { node: operatorNode, service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
                cb(null, null)
              })
            })
          }
          return;
        }

        if(obj.keys.length == 1 && obj.keys[0] == 'indexer') {
          
          distribution.local.store.get({gid: obj.gid, key: null}, (e, keys) => { // not local make it group
            function isSHA256(filename) {
              const sha256Regex = /^[a-f0-9]{64}$/i;
              return sha256Regex.test(filename);
            }

            obj.keys = keys.filter(key => isSHA256(key))
            total = obj.keys.length;
            go(cb)
          })
        }else {
          go(cb)
        }
      }

      function mapSync(obj, cb) {
        const memberAmount = obj.memberCount
        count += 1
        // console.log("here is map sync");
        // console.log(memberAmount);
        // console.log(count);
        if(count == memberAmount){ 
          count = 0
          distribution[obj.gid].comm.send(
            [{ keys: obj.keys, memberCount: obj.memberCount, gid: obj.gid, hash: id.consistentHash, node: distribution.node.config, serviceNames: obj.serviceNames, operation: 'start_shuffle' }],
            { service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
              cb(null, null)
            })
        }else {
          cb(null, null)
        }
      }

      function shuffleSync(obj, cb) {
        const memberAmount = obj.memberCount
        count += 1
        if(count == memberAmount){ 
          count = 0

          distribution[obj.gid].comm.send(
            [{ keys: obj.keys, gid: obj.gid, node: distribution.node.config, serviceNames: obj.serviceNames, operation: 'start_reduce' }],
            { service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
              cb(null, null)
            })
        }else {
          cb(null, null)
        }
      }

      function reduceSync(obj, cb) {
        const memberAmount = obj.memberCount
        count += 1
        // console.log("I AM IN REDUCE SYNC");
        // console.log(count);
        // console.log(memberAmount);
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
        // console.log("I AM IN START REDUCE");
        distribution.local.store.get({key: null, gid: obj.gid}, (e, keys) => {
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
            if(key.includes('shuffleValue')) {
              distribution.local.store.get({key: key, gid: obj.gid}, (e, v) => {
                distribution.local.store.del({key: key, gid: obj.gid}, (e, v) => {
                  i += 1
                  for(const mapping of v) {
                    const key = Object.keys(mapping)[0]
                    const value = mapping[key]
                    if(map[key]) {
                      map[key].push(value)
                    }else {
                      map[key] = [value]
                    }
                  }
    
    
                  if(i == keys.length) {
                    let res = []
                    distribution.local.routes.get(obj.serviceNames.reduceServiceName, (e, returnedService) => {
                      for(const [key, value] of Object.entries(map)){ 
                        const output = returnedService.reduce(key, value)
                        res.push(output)
                      }

                      let key;
                      
                      if(obj.keys.length == 1 && obj.keys[0] == 'urls') {
                        key = 'urls'
                      } else {
                        key = 'result'
                      }

                      distribution.local.store.put(res, { key: key, gid: obj.gid }, (e, v) => {
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
              })
            }else {
              i += 1
              if(i == keys.length) {
                cb(null, null)
              }
            }
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
          if(e) {
            cb(e, null)
          }

          distribution.local.store.del({gid: obj.gid, key: 'mappedValues'}, (e, res) => {
            if(mappedValues.length == 0) {
              cb(null, null)
              return
            }

            let nodeToUrls = {}
            for(const mapping of mappedValues){ 
              const nodeKey = id.consistentHash(id.getID(Object.keys(mapping)[0]), Object.keys(group))
              if(nodeToUrls[nodeKey]) {
                nodeToUrls[nodeKey].push(mapping)
              }else {
                nodeToUrls[nodeKey] = [mapping]
              }
            }

            let i = 0

            for(const nodeKey of Object.keys(nodeToUrls)){ 
              const node = group[nodeKey]
              const remote = {node: node, service: "store", method: "put"}
              const arr = nodeToUrls[nodeKey]
              distribution.local.comm.send([arr, {key: 'shuffleValue ' + distribution.node.config.port, gid: obj.gid}], remote, (e, v) => {
                i += 1
                if(i == Object.keys(nodeToUrls).length) {
                  cb(null, null)
                }
              })
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

    // console.log("in map reduce");

    distribution.local.routes.put(notifyService, notifyServiceName, (e, v) => {
      distribution[context.gid].routes.put(notifyService, notifyServiceName, (e, v) => {
        distribution[context.gid].routes.put(mapService, mapServiceName, (e, v) => {
          distribution[context.gid].routes.put(reduceService, reduceServiceName, (e, v) => {
            distribution[context.gid].routes.put(shuffleService, shuffleServiceName, (e, v) => {
              distribution.local.groups.get(context.gid, (e, group) => {
              distribution[context.gid].comm.send(
                [{memberCount: Object.keys(group).length, gid: context.gid, node: distribution.node.config, serviceNames: serviceNames, operation: 'operator_sync'}],
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
                      // distribution.local.comm.send(params2, remote2, (e, v) => {
                        iterator += 1
                        arr = arr.concat(v)
                        if(iterator == Object.keys(group).length) {
                          cb(null, arr)
                        }
                      // })
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
