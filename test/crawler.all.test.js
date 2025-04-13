const distribution = require('../config')
const id = distribution.util.id;



const {mapper, reducer} = require('../distribution/engine/crawler-mapreduce/crawler-functions');

const crawlGroupGroup = {};

let localServer = null

// const kafkaNode = {ip: '127.0.0.1', port: 9001, kafka: true}
const workerNode1 = {ip: '127.0.0.1', port: 7000}
const workerNode2 = {ip: '127.0.0.1', port: 7001}

// const indexerNode1 = {ip: '127.0.0.1', port: 9003, onStart: () => {}}
// const indexerNode2 = {ip: '127.0.0.1', port: 9004, onStart: () => {}}
// const indexerNode3 = {ip: '127.0.0.1', port: 9005, onStart: () => {}}

test('crawler mapreduce', (done) => {
  const urls = [
    'https://cs.brown.edu/courses/csci1380/sandbox/1',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/index.html',
    'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/fact_6/index.html'
  ]

  distribution.local.groups.get('crawlGroup', (e, group) => {
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
      distribution.local.comm.send([value, {key: 'urls', gid: 'crawlGroup'}], remote, (e, v) => {
        console.log(e, v)
        iter += 1
        if(iter == Object.keys(nodeToUrls).length){ 
          distribution.crawlGroup.mr.exec({keys: ['urls'], map: mapper, reduce: reducer}, (e, v) => {
            console.log(e, v)
            done()
          })
        }
      })
    }
  })
})

  // const remote = {node: node, service: 'store', method: 'put'}
  //     const message = [, {key: 'urls', gid: 'crawlGroup'}]
  //     distribution.local.commm.send(message, remote, (e, v) => {
  //       iter += 1
  //       if(iter == group.length) {
  //         // do mapreduce job
  //       }
  //     })

// test('try to get the kafka queue running with the worker node', (done) => {
//     distribution.crawlGroup.groups.put('crawlGroup', crawlGroupGroup, (e, v) => {
//       distribution.processGroup.groups.put('processGroup', processGroupGroup, (e, v) => {
//           distribution.local.comm.send([], {node: workerNode1, service: 'crawl', method: 'startCrawler'},  (e, v) => {
//             console.log(e, v)
//           })
//       })
//     })  
// })

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
  crawlGroupGroup[id.getID(workerNode1)] = workerNode1
  crawlGroupGroup[id.getID(workerNode2)] = workerNode2

  const startNodes = (cb) => {
    distribution.local.status.spawn(workerNode1, (e, v) => {
      distribution.local.status.spawn(workerNode2, (e, v) => {
        cb();
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    startNodes(() => {
      const crawlGroupConfig = {gid: 'crawlGroup'};
      distribution.local.groups.put(crawlGroupConfig, crawlGroupGroup, (e, v) => {
        distribution.crawlGroup.groups.put(crawlGroupConfig, crawlGroupGroup, (e, v) => {
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
        localServer.close();
        done();
      })
    })
  });
  
  