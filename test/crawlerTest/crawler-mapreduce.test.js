const distribution = require('../../config.js');
const id = distribution.util.id;
// const startCrawler = require('../../distribution/engine/crawler.js')

// const {mapper, reducer} = require('../../distribution/engine/indexer.js')
const {mapper, reducer} = require('../../distribution/engine/crawler-mapreduce/crawler-functions.js')

const crawlGroupConfig = {gid: 'crawlGroup'};
const crawlGroupGroup = {};

const processGroupConfig = {gid: 'processGroup'}
const processGroupGroup = {};

let localServer = null

const workerNode1 = {ip: '127.0.0.1', port: 9002}
const workerNode2 = {ip: '127.0.0.1', port: 9003}
const workerNode3 = {ip: '127.0.0.1', port: 9004}

// const indexerNode1 = {ip: '127.0.0.1', port: 9003, onStart: () => {}}
// const indexerNode2 = {ip: '127.0.0.1', port: 9004, onStart: () => {}}
// const indexerNode3 = {ip: '127.0.0.1', port: 9005, onStart: () => {}}


// test('try to get the kafka queue running with the worker node', (done) => {
//     distribution.crawlGroup.groups.put('crawlGroup', crawlGroupGroup, (e, v) => {
//       distribution.processGroup.groups.put('processGroup', processGroupGroup, (e, v) => {
//           distribution.local.comm.send([], {node: workerNode1, service: 'crawl', method: 'startCrawler'},  (e, v) => {
//             console.log(e, v)
//           })
//       })
//     })  
// })

test('test crawler mapreduce', (done) => {
  const urls = [
    'https://cs.brown.edu/courses/csci1380/sandbox/1',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/level_2a/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/level_2b/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/fact_3/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/fact_4/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/fact_5/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/fact_6/index.html'
  ]

  function getKeys(urls) {
    let keys = []
    for(const url of urls) {
        keys.push(id.getID(url))
    }

    return keys
  }

  let iteration = 0

  for(const url of urls) {
    distribution.local.groups.get('crawlGroup', (e, group) => {
        const node = id.consistentHash(id.getID(url), Object.keys(group))
        console.log(group[node])
        distribution.local.comm.send([url, {key: id.getID(url), gid: 'crawlGroup'}], {service: 'store', method: 'put', node: group[node]}, (e, v) => {
            iteration += 1
            if(iteration == urls.length) {
                distribution.crawlGroup.mr.exec({keys: urls, map: mapper, reduce: reducer}, (e, v) => {
                    console.log('done')
                    done()
                })
            }
        })
    })
  }
})

// test('test indexer mapreduce', (done) => {
//   distribution.crawlGroup.groups.put('crawlGroup', crawlGroupGroup, (e, v) => {
//     distribution.processGroup.groups.put('processGroup', processGroupGroup, (e, v) => {
//       distribution.local.comm.send([], {node: workerNode1, service: 'crawl', method: 'startCrawler'},  (e, v) => {
//         distribution.crawlGroup.store.get(null, (e, keys) => {
//           distribution.crawlGroup.mr.exec([{keys: keys, mapper: mapper, reducer: reducer}], (e, v) => {
//             console.log(e, v)
//           })
//         })
//       })
//     })
//   })
// })

beforeAll((done) => {
    // First, stop the nodes if they are running
    const remote = {service: 'status', method: 'stop'};
    remote.node = workerNode1;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = workerNode2;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = workerNode3;
          distribution.local.comm.send([], remote, (e, v) => {
            startNodes();
          });
        })
    })
  
  
    const startNodes = () => {
      // crawlGroupGroup[id.getSID(kafkaNode)] = kafkaNode;
      crawlGroupGroup[id.getSID(workerNode1)] = workerNode1;
      crawlGroupGroup[id.getSID(workerNode2)] = workerNode2;
      crawlGroupGroup[id.getSID(workerNode3)] = workerNode3;

      processGroupGroup[id.getSID(workerNode1)] = workerNode1
  
      const groupInstantiation = () => {
        // Create the groups
        distribution.local.groups
            .put(crawlGroupConfig, crawlGroupGroup, (e, v) => {
              distribution.local.groups
              .put(processGroupConfig, processGroupGroup, (e, v) => {
                done();
              })
            });
      };
  
      // Now, start the nodes listening node
      distribution.node.start((server) => {
        localServer = server;
  
        // Start the nodes
          distribution.local.status.spawn(workerNode1, (e, v) => {
            distribution.local.status.spawn(workerNode2, (e, v) => {
                distribution.local.status.spawn(workerNode3, (e, v) => {
                    groupInstantiation();
                })
            })
          });
      })
    
    };
  
  });
  
  afterAll((done) => {
    const remote = {service: 'status', method: 'stop'};
    remote.node = workerNode1;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = workerNode2;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = workerNode3;
        distribution.local.comm.send([], remote, (e, v) => {
            localServer.close();
            done();
        })
      })
    })
  });
  
  