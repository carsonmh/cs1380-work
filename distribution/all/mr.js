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

    function notify(obj, cb) {
      function operatorSync(obj, cb) {
        distribution.local.comm.send([{ operation: 'worker_sync', node: distribution.node.config }], { node: obj.node, service: obj.serviceNames.notifyServiceName, method: 'notify' }, (e, v) => {
          cb(null, null)
        })
      }


      function workerSync(obj, cb) {
        distribution.local.data.workersMap[id.getNID(obj.node)] = true
        distribution.local.data.workersSyncedCount += 1
        cb(null, null)
      }

      function startMap(obj, cb) {
        let arr = []
        let counter = 0
        let total = obj.keys.length
        for (const key of obj.keys) {
          distribution.local.store.get({ gid: obj.gid, key: key }, (e, data) => {
            distribution.local.routes.get(obj.serviceNames.mapServiceName, (e, returnedService) => {
              const result = returnedService.map(key, data)
              arr.push(result)
              counter += 1
              if (counter == total) {
                distribution.local.store.put(arr, { key: 'mappedValues', gid: obj.gid }, (e, v) => {
                  operatorSync(obj, cb)
                })
              }
            })
          })
        }
      }

      function callShuffle(obj, cb) {
        distribution.local.routes.get(obj.serviceNames.shuffleServiceName, (e, returnedService) => {
          returnedService.shuffle(obj, (e, v) => {
            operatorSync(obj, cb)
          })
          // for (const [key, value] of Object.entries(v)) {
          //   if (res[key]) {
          //     res[key].push(v[key])
          //   } else {
          //     res[key] = [v[key]]
          //   }
          // }
        })
      }

      function startReduce(obj, cb) {
        distribution.local.mem.get({key: null, gid: obj.gid}, (e, keys) => {
          let map = {}
          let i = 0
          for(key of keys) {
            i += 1
            distribution.local.mem.get({key: key, gid: obj.gid}, (e, v) => {
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

                  cb(null, res)
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
        case "start_shuffle":
          callShuffle(obj, cb)
          break
        case "start_reduce":
          startReduce(obj, cb)
          break
        default:
          throw new Error("There shouldn't be a default call here")
      }
    }

    function shuffle(obj, cb) {
      const id = require('../util/id')
      distribution.local.groups.get(obj.gid, (e, group) => {
        distribution.local.store.get({gid: obj.gid, key: 'mappedValues'}, (e, mappedValues) => {
          let i = 0
          for(const mapping of mappedValues){ 
            i += 1
            const nodePort = distribution.node.config.port
            const key = Object.keys(mapping)[0] + ' ' + nodePort  + i
            const kid = Object.keys(mapping)[0]
            const node = id.naiveHash(id.getID(kid), Object.keys(group))
            const remote = {node: group[node], service: "mem", method: "put"}
            distribution.local.comm.send([mapping, {key: key, gid: obj.gid}], remote, (e, v) => {
              console.log(group[node], v)
              if(i == mappedValues.length) {
                cb(null, null)
              }
            })
          }
        })
      })
    }


    function setData() {
      distribution.local.data = {
        workersMap: {},
        workersSyncedCount: 0
      }
    }

    setData()

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

    function sendNotifyWaitAllNodes(gid, params, cb) {
      distribution.local.groups.get(gid, (e, group) => {
        if(e) {
          cb(e, null)
        }

        let counter = 0
        for(const [key, value] of Object.entries(group)) {
          const remote = {node: value, service: notifyServiceName, method: 'notify'}
          const params = params
          distribution.local.comm.send(params, remote, (e, v) => {
            
            if(counter == Object.keys(group)) {
              cb(null, null)
            }
          })
        }
      })
    }

    distribution.local.routes.put(notifyService, notifyServiceName, (e, v) => {

      distribution[context.gid].routes.put(notifyService, notifyServiceName, (e, v) => {

        distribution[context.gid].comm.send(
          [{ node: distribution.node.config, serviceNames: serviceNames, operation: 'operator_sync' }],
          { service: notifyServiceName, method: 'notify' },
          (e, v) => {

            const memberAmount = Object.keys(distribution.local.groups[context.gid]).length
            let id1 = setInterval(() => {
              if (memberAmount == distribution.local.data.workersSyncedCount) {
                clearInterval(id1)
                setData()
                distribution[context.gid].routes.put(mapService, mapServiceName, (e, v) => {

                  distribution[context.gid].routes.put(reduceService, reduceServiceName, (e, v) => {

                    distribution[context.gid].routes.put(shuffleService, shuffleServiceName, (e, v) => {

                      distribution.local.groups.get(context.gid, (e, group) => {

                        const keys = configuration.keys
                        let nodeToKeys = {}

                        for (const key of keys) {
                          const node = id.naiveHash(id.getID(key), Object.keys(group))
                          if (nodeToKeys[node]) {
                            nodeToKeys[node].push(key)
                          } else {
                            nodeToKeys[node] = [key]
                          }
                        }

                        let counter = 0

                        const total = Object.keys(nodeToKeys).length
                        for (const [key, value] of Object.entries(nodeToKeys)) {
                          const obj = { keys: value, node: distribution.node.config, serviceNames: serviceNames, operation: 'start_map', gid: context.gid }
                          const remote = { node: group[key], service: notifyServiceName, method: 'notify' }
                          distribution.local.comm.send(
                            [obj], remote, (e, v) => {
                              counter += 1
                              if (counter == total) {
                                let id2 = setInterval(() => {
                                  if (memberAmount == distribution.local.data.workersSyncedCount) {
                                    clearInterval(id2)
                                    setData()

                                    distribution[context.gid].comm.send(
                                      [{ gid: context.gid, hash: id.naiveHash, node: distribution.node.config, serviceNames: serviceNames, operation: 'start_shuffle' }],
                                      { service: notifyServiceName, method: 'notify' }, (e, v) => {
                                        let id3 = setInterval(() => {
                                          clearInterval(id3)
                                          setData()

                                          distribution[context.gid].comm.send(
                                            [{ gid: context.gid, node: distribution.node.config, serviceNames: serviceNames, operation: 'start_reduce' }],
                                            { service: notifyServiceName, method: 'notify' }, (e, v) => {
                                              let res = []
                                              for(const [key, value] of Object.entries(v)){
                                                for(const item of value) {
                                                  res.push(item)
                                                }
                                              }

                                              cb(e, res)
                                            })
                                        }, 100)
                                    })
                                  }
                                }, 100)
                              }
                            })
                        }
                      })
                    })
                  })
                })
              }
            }, 100)
          })
      })
    })
  }

  return { exec };
};

module.exports = mr;
