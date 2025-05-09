const readline = require('readline');
const distribution = require('../config');
const id = distribution.util.id;
const args = require('yargs').argv;

const {mapper, reducer} = require('./engine/crawler-functions');
const {indexReducer, indexMapper} = require('./engine/indexer')



const crawlGroupGroup = {};
let localServer = null;

function promptForWorkerNodes() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const workerNodes = [];
    
    function askForNode() {
      rl.question('Enter worker node IP and port (format: "ip:port"), or press enter to finish: ', (answer) => {
        if (answer.trim() === '') {
          rl.close();
          resolve(workerNodes);
        } else {
          const [ip, port] = answer.split(':');
          if (ip && port) {
            workerNodes.push({ ip: ip.trim(), port: parseInt(port.trim()) });
            askForNode();
          } else {
            console.log('Invalid format. Please use "ip:port" format.');
            askForNode();
          }
        }
      });
    }

    askForNode();
  });
}

async function start() {
  const workerNodes = await promptForWorkerNodes();

  startTime = performance.now()
  console.log("starting @ ", startTime)
  
  if (workerNodes.length === 0) {
    console.log('No worker nodes provided. Exiting.');
    process.exit(1);
  }

  // Populate crawlGroupGroup with the provided worker nodes
  workerNodes.forEach(node => {
    crawlGroupGroup[id.getID(node)] = node;
  });

  const crawlGroupConfig = {gid: 'workers'};
  distribution.local.groups.put(crawlGroupConfig, crawlGroupGroup, (e, v) => {
    distribution.workers.groups.put(crawlGroupConfig, crawlGroupGroup, (e, v) => {
      const urls = [
        'https://law.justia.com/codes/alabama/title-1/',
        'https://law.justia.com/codes/alabama/title-2/',
        'https://law.justia.com/codes/alabama/title-3/',
        'https://law.justia.com/codes/alabama/title-4/',
        'https://law.justia.com/codes/alabama/title-5/',
        'https://law.justia.com/codes/alabama/title-6/',
        'https://law.justia.com/codes/alabama/title-7/',
        'https://law.justia.com/codes/alabama/title-8/',
        'https://law.justia.com/codes/alabama/title-9/',
      ];

    
      distribution.local.groups.get('workers', (e, group) => {
        const nodeToUrls = {}
        for(const url of urls) {
          const urlId = id.getID(url)
          const nodeKey = id.rendezvousHash(urlId, Object.keys(group))
          const node = group[nodeKey]
          if(nodeToUrls[nodeKey]) {
            nodeToUrls[nodeKey].push(url)
          } else {
            nodeToUrls[nodeKey] = [url]
          }
        }
    
        let iter = 0;

        function incrementAndStart() {
          iter += 1
          if(iter == Object.keys(nodeToUrls).length){ 
            run((e, v) => {
              console.log("done")
            })
          }
        }
    
        for(const [key, value] of Object.entries(nodeToUrls)) {
          const getRemote = {node: group[key], service: 'store', method: 'get'}

          distribution.local.comm.send([{key: 'urls-file-1234', gid: 'workers'}], getRemote, (e, v) => {
            const putRemote = {node: group[key], service: 'store', method: 'put'}
            if(!v) {
              distribution.local.comm.send([value, {key: 'urls-file-1234', gid: 'workers'}], putRemote, (e, v) => {
                incrementAndStart()
              })
            }else {
              incrementAndStart()
            }
          })
        }
      })
    });
  });
}

let iterations = 0;
let numIterations = args.iterations ? args.iterations : 1;
let startTime;

function run(cb) {
  console.log('running iteration', iterations)
  let time = performance.now()
  console.log('starting crawler @ ', time)
  distribution.workers.mr.exec({keys: ['urls-file-1234'], map: mapper, reduce: reducer}, (e, v) => {
    time = performance.now()
    console.log("ran crawler @ ", time)
    if(e) {
      console.log(e)
    }
    distribution.workers.mem.get(null, (e, v) => {
      let count = 0;
      for(const [key, value] of Object.entries(v)) {
        count += value.length;
      }


      const serializedReducer = global.distribution.util.serialize(indexReducer);
      const updatedSerializedReducer = serializedReducer.replace('numDocs = 0;', `numDocs = ${count};`);
      let reducertfidf = global.distribution.util.deserialize(updatedSerializedReducer);
      console.log('starting indexer @ ', time)
      distribution.workers.mr.exec({keys: ['indexer'], map: indexMapper, reduce: reducertfidf}, (e, v) => {
        time = performance.now()
        console.log("ran indexer @ ", time)
        if(e) {
          console.log(e, v)
        }

        if(iterations < numIterations) {
          if(count >= 1000) {
            cb(null, null)
            const endTime = performance.now();
            console.log("done. Time taken: ", endTime - startTime)
            return
          }
          iterations += 1
          console.log('crawled: ', count)
          run(cb)
        } else {
          console.log("stopping for now...")
          // Stop all worker nodes
          // const stopPromises = Object.values(crawlGroupGroup).map(node => {
          //   return new Promise((resolve) => {
          //     const remote = {service: 'status', method: 'stop', node};
          //     distribution.local.comm.send([], remote, (e, v) => {
          //       resolve();
          //     });
          //   });
          // });

          // Promise.all(stopPromises).then(() => {
          //   localServer.close();
          //   cb(null, null);
          // });
        }
      })
    })
  })
}

// const startNodes = (cb) => {
//   const spawnPromises = Object.values(crawlGroupGroup).map(node => {
//     return new Promise((resolve) => {
//       distribution.local.status.spawn(node, (e, v) => {
//         resolve();
//       });
//     });
//   });

//   Promise.all(spawnPromises).then(() => {
//     cb();
//   });
// };

global.nodeConfig = {
  ip: args.ip,
  port: args.port,
  onStart: () => {
    console.log(`Node started!`);
  },
}

distribution.node.start((server) => {
  localServer = server;
  start();
});