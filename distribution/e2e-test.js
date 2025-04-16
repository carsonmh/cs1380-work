const readline = require('readline');
const distribution = require('../config');
const id = distribution.util.id;

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
        'https://law.justia.com/codes/alabama/2024/',
      ];
    
      distribution.local.groups.get('workers', (e, group) => {
        const nodeToUrls = {}
        for(const url of urls) {
          const urlId = id.getID(url)
          const nodeKey = id.consistentHash(urlId, Object.keys(group))
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

          distribution.local.comm.send([{key: 'urls', gid: 'workers'}], getRemote, (e, v) => {
            const putRemote = {node: group[key], service: 'store', method: 'put'}
            if(!v) {
              distribution.local.comm.send([value, {key: 'urls', gid: 'workers'}], putRemote, (e, v) => {
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

function run(cb) {
  distribution.workers.mr.exec({keys: ['urls'], map: mapper, reduce: reducer}, (e, v) => {
    console.log(e, v)
    distribution.workers.mem.get(null, (e, v) => {
      let count = 0;
      for(const [key, value] of Object.entries(v)) {
        count += value.length;
      }

      const serializedReducer = global.distribution.util.serialize(indexReducer);
      const updatedSerializedReducer = serializedReducer.replace('numDocs = 0;', `numDocs = ${count};`);
      let reducertfidf = global.distribution.util.deserialize(updatedSerializedReducer);
      
      distribution.workers.mr.exec({keys: ['indexer'], map: indexMapper, reduce: reducertfidf}, (e, v) => {
        console.log(e, v)
        if(iterations < 1) {
          iterations += 1
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

distribution.node.start((server) => {
  localServer = server;
  start();
});