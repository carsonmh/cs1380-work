const distribution = require('../../config.js');
const id = distribution.util.id;
const startCrawler = require('../../distribution/engine/crawler.js')

const {mapper, reducer} = require('../../distribution/engine/indexer.js')

const crawlGroupConfig = {gid: 'crawlGroup'};
const crawlGroupGroup = {};

const processGroupConfig = {gid: 'processGroup'}
const processGroupGroup = {};

let localServer = null

jest.setTimeout(20000)

const kafkaNode = {ip: '127.0.0.1', port: 9001, kafka: true}
const workerNode1 = {ip: '127.0.0.1', port: 9002}
// const workerNode2 = {ip: '127.0.0.1', port: 9002, onStart: startCrawler}

// const indexerNode1 = {ip: '127.0.0.1', port: 9003, onStart: () => {}}
// const indexerNode2 = {ip: '127.0.0.1', port: 9004, onStart: () => {}}
// const indexerNode3 = {ip: '127.0.0.1', port: 9005, onStart: () => {}}


test('try to get the kafka queue running with the worker node', (done) => {
    distribution.crawlGroup.groups.put('crawlGroup', crawlGroupGroup, (e, v) => {
      distribution.processGroup.groups.put('processGroup', processGroupGroup, (e, v) => {
          distribution.local.comm.send([], {node: workerNode1, service: 'crawl', method: 'startCrawler'},  (e, v) => {
            console.log(e, v)
          })
      })
    })  
})

// test('test crawler mapreduce', (done) => {
  
// })

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
    remote.node = kafkaNode;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = workerNode1;
      distribution.local.comm.send([], remote, (e, v) => {
          distribution.local.comm.send([], remote, (e, v) => {
            startNodes();
          });
        })
    })
  
  
    const startNodes = () => {
      // crawlGroupGroup[id.getSID(kafkaNode)] = kafkaNode;
      crawlGroupGroup[id.getSID(workerNode1)] = workerNode1;

      processGroupGroup[id.getSID(workerNode1)] = workerNode1
      processGroupGroup[id.getSID(kafkaNode)] = kafkaNode
  
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
        distribution.local.status.spawn(kafkaNode, (e, v) => {
          distribution.local.status.spawn(workerNode1, (e, v) => {
            groupInstantiation();
          });
        });
      })
    
    };
  
  });
  
  afterAll((done) => {
    const remote = {service: 'status', method: 'stop'};
    remote.node = kafkaNode;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = workerNode1;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      })
    })
  });
  
  