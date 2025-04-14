const distribution = require('../../config.js');
const id = distribution.util.id;
const fs = require('fs');
const serialization = require('../util/serialization');

const {indexMapper, indexReducer} = require('./indexer.js')

const workerGroup = {};

let localServer = null;

const n1 = { ip: '127.0.0.1', port: 7110 };
const n2 = { ip: '127.0.0.1', port: 7111 };
const n3 = { ip: '127.0.0.1', port: 7112 };


const {mapper, reducer} = require('../engine/crawler-mapreduce/crawler-functions.js');

function end() {
    const remote = {service: 'status', method: 'stop'};
    remote.node = n1;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n2;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n3;
        distribution.local.comm.send([], remote, (e, v) => {
                localServer.close();
            });
        });
    });
}

function startNodes(callback) {
    distribution.local.status.spawn(n1, (e, v) => {
        distribution.local.status.spawn(n2, (e, v) => {
            distribution.local.status.spawn(n3, (e, v) => {
                callback();
            });
        });
    });
}



// use this function to check the number of urls (number of documents or not)
function isSHA256(filename) {
    const sha256Regex = /^[a-f0-9]{64}$/i;
    return sha256Regex.test(filename);
}

// calculates number of documents
function calculate_document_number() {
    distribution.workers.store.get(null, (e, v) => {
        let realkeys =[];
            v.forEach(key_name => {
                if (isSHA256(key_name)) {
                    realkeys.push(key_name);
                }
            });
        do_tf_idf(realkeys);
    });
}


function do_tf_idf(keys){
    const serializedReducer = global.distribution.util.serialize(indexReducer);

    const updatedSerializedReducer = serializedReducer.replace('num_docs = 0;', `num_docs = ${keys.length};`);

    let reducertfidf = global.distribution.util.deserialize(updatedSerializedReducer);

    distribution.workers.mr.exec({keys: keys, map: indexMapper, reduce: reducertfidf}, (e, v) => {
        try {
          end();
        } catch (e) {
          console.log(e);
        }
    });
}

const workerConfig = {  gid: 'workers' };

function isValidURL(str) {
    try {
        new URL(str);
        return true;
    } catch (_) {
        return false;
    }
}

function compose_crawl_index() {
    // const urlFilePath = 'url.txt';

    // Write initial URL to start crawling
    // if (!fs.existsSync(urlFilePath) || fs.readFileSync(urlFilePath, 'utf8').trim() === '') {
    //     fs.writeFileSync(urlFilePath, 'https://www.gutenberg.org\n', 'utf8');
    // }

    function loop() {
        // let urls = fs.readFileSync(urlFilePath, 'utf8').split('\n').filter(u => u.trim() !== '');
        // if (urls.length === 0) {
        //     console.log('No more URLs to crawl. Stopping.');
        //     end();
        //     return;
        // }
        // // Filter out invalid URLs
        // urls = urls.filter(isValidURL);

        // // Overwrite file with only valid URLs
        // fs.writeFileSync(urlFilePath, urls.join('\n'), 'utf8');

        // if (urls.length === 0) {
        //     console.log('No more valid URLs to crawl. Stopping.');
        //     end();
        //     return;
        // }

        // STEP 1: Crawl + distribute urls 
        // distribution.local.groups.get('workers', (e, group) => {
        //     const nodeToUrls = {}
        //     for(const url of urls) {
        //       const urlId = id.getID(url)
        //       const nodeKey = id.consistentHash(urlId, Object.keys(group))
        //       const node = group[nodeKey]
        //       if(nodeToUrls[nodeKey]) {
        //         nodeToUrls[nodeKey].push(url)
        //       }else {
        //         nodeToUrls[nodeKey] = [url]
        //       }
        //     }
        
        //     let iter = 0;
        
        //     for(const [key, value] of Object.entries(nodeToUrls)) {
        //       const remote = {node: group[key], service: 'store', method: 'put'}
        //       console.log("here is the value I am putting");
        //       console.log(value);
        //       distribution.local.comm.send([value, {key: 'urls', gid: 'workers'}], remote, (e, v) => {
        //         console.log(e, v)
        //         iter += 1
        //         if(iter == Object.keys(nodeToUrls).length){ 
        //           distribution.workers.mr.exec({keys: ['urls'], map: mapper, reduce: reducer}, (e, v) => {
        //             // console.log(v)
        //             // flatten the output 
        //             const flattened = v.flat();
        //             const fileContent = flattened.join('\n');
        //             fs.writeFileSync('url.txt', fileContent, 'utf8');

        //             // now we do the map and reduce for the indexer 
        //             // STEP 2: Now we run the indexer on the new values 
        //             calculate_document_number();
        //             // loop(); // -> this would be for the final version
        //           })
        //         }
        //       })
        //     }
        //   })

        const urls = [
            'https://cs.brown.edu/courses/csci1380/sandbox/1',
            'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html',
            'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1b/index.html',
            'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/index.html',
            'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/fact_6/index.html',
          ]

          console.log("starting crawler")
        
          distribution.local.groups.get('workers', (e, group) => {
            const nodeToUrls = {}
            for(const url of urls) {
              const urlId = id.getID(url)
              const nodeKey = id.consistentHash(urlId, Object.keys(group))
              console.log(nodeKey, urlId)
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
                    calculate_document_number();
                  })
                }
              })
            }
          })
    }

    loop();
}

function run() {
    distribution.node.start((server) => {
        localServer = server;

        workerGroup[id.getSID(n1)] = n1;
        workerGroup[id.getSID(n2)] = n2;
        workerGroup[id.getSID(n3)] = n3;


        startNodes(() => {
            // this is just for testing purposes only 
            distribution.local.groups.put(workerConfig, workerGroup, (e, v) => {
                distribution.workers.groups.put(workerConfig, workerGroup, (e, v) => {
                    // start the crawling
                    compose_crawl_index();
                });
            });
        });
    });
}

run();