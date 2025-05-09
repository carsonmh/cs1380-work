const distribution = require('../config')
const id = distribution.util.id;



const {mapper, reducer} = require('../distribution/engine/crawler-mapreduce/crawler-functions');
const {indexReducer, indexMapper} = require('../distribution/components/indexer')

const crawlGroupGroup = {};

let localServer = null

// const kafkaNode = {ip: '127.0.0.1', port: 9001, kafka: true}
const workerNode1 = {ip: '127.0.0.1', port: 7000}
const workerNode2 = {ip: '127.0.0.1', port: 7001}
const workerNode3 = {ip: '127.0.0.1', port: 7002}
const workerNode4 = {ip: '127.0.0.1', port: 7003}

jest.setTimeout(5000)
// const indexerNode1 = {ip: '127.0.0.1', port: 9003, onStart: () => {}}
// const indexerNode2 = {ip: '127.0.0.1', port: 9004, onStart: () => {}}
// const indexerNode3 = {ip: '127.0.0.1', port: 9005, onStart: () => {}}

/*
test('crawler mapreduce', (done) => {
  const urls = [
    'https://law.justia.com/codes/alabama/2024/',
  ]

  distribution.local.groups.get('workers', (e, group) => {
    const nodeToUrls = {}
    for(const url of urls) {
      const urlId = id.getID(url)
      const nodeKey = id.consistentHash(urlId, Object.keys(group))
      const node = group[nodeKey]
      if(nodeToUrls[nodeKey]) {
        nodeToUrls[nodeKey].push(url)
      }else {
        nodeToUrls[nodeKey] = [url]
      }
    }

    let iter = 0;

    for(const [key, value] of Object.entries(nodeToUrls)) {
      const remote = {node: group[key], service: 'store', method: 'put'}
      distribution.local.comm.send([value, {key: 'urls', gid: 'workers'}], remote, (e, v) => {
        iter += 1
        if(iter == Object.keys(nodeToUrls).length){ 
          distribution.workers.mr.exec({keys: ['urls'], map: mapper, reduce: reducer}, (e, v) => {
            distribution.workers.mr.exec({keys: ['urls'], map: mapper, reduce: reducer}, (e, v) => {
              distribution.workers.mr.exec({keys: ['urls'], map: mapper, reduce: reducer}, (e, v) => {
                done()
              })
            })
          })
        }
      })
    }
  })
})
*/

test('indexer mapreduce', (done) => {
  const urls = [
    'https://law.justia.com/codes/alabama/2024/',
  ]

  distribution.local.groups.get('workers', (e, group) => {
    const nodeToUrls = {}
    for(const url of urls) {
      const urlId = id.getID(url)
      const nodeKey = id.consistentHash(urlId, Object.keys(group))
      const node = group[nodeKey]
      if(nodeToUrls[nodeKey]) {
        nodeToUrls[nodeKey].push(url)
      }else {
        nodeToUrls[nodeKey] = [url]
      }
    }

    let iter = 0;

    for(const [key, value] of Object.entries(nodeToUrls)) {
      const remote = {node: group[key], service: 'store', method: 'put'}
      distribution.local.comm.send([value, {key: 'urls', gid: 'workers'}], remote, (e, v) => {
        iter += 1
        if(iter == Object.keys(nodeToUrls).length){ 
          distribution.workers.mr.exec({keys: ['urls'], map: mapper, reduce: reducer}, (e, v) => {
            distribution.workers.mem.get(null, (e, v) => {
              let count = 0
              for(const key of Object.keys(v)){
                  count += v[key].length
              }

              const serializedReducer = global.distribution.util.serialize(indexReducer);

              const updatedSerializedReducer = serializedReducer.replace('num_docs = 0;', `num_docs = ${count};`);

              let reducertfidf = global.distribution.util.deserialize(updatedSerializedReducer);
              distribution.workers.mr.exec({keys: ['indexer'], map: indexMapper, reduce: reducertfidf}, (e, v) => {
                done()
              })
            })
          })
        }
      })
    }
  })
})

beforeAll((done) => {
  crawlGroupGroup[id.getID(workerNode1)] = workerNode1
  crawlGroupGroup[id.getID(workerNode2)] = workerNode2
  crawlGroupGroup[id.getID(workerNode3)] = workerNode3
  crawlGroupGroup[id.getID(workerNode4)] = workerNode4

  const startNodes = (cb) => {
    distribution.local.status.spawn(workerNode1, (e, v) => {
      distribution.local.status.spawn(workerNode2, (e, v) => {
        distribution.local.status.spawn(workerNode3, (e, v) => {
          distribution.local.status.spawn(workerNode4, (e, v) => {
            cb();
          });
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    startNodes(() => {
      const crawlGroupConfig = {gid: 'workers'};
      distribution.local.groups.put(crawlGroupConfig, crawlGroupGroup, (e, v) => {
        distribution.workers.groups.put(crawlGroupConfig, crawlGroupGroup, (e, v) => {
            done();
          });
        });
      });
    });
  });
  
  afterAll((done) => {
    const remote = {service: 'status', method: 'stop'};
    remote.node = workerNode2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = workerNode1;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = workerNode3;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = workerNode4;
          distribution.local.comm.send([], remote, (e, v) => {
            localServer.close();
            done();
          })
        })
      })
    })
  });
  
  