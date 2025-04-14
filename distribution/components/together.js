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

    // can't just be URLs becaues it is searching by key
    distribution.workers.mr.exec({keys: ['indexer'], map: indexMapper, reduce: reducertfidf}, (e, v) => {
        try {
        compose_crawl_index()
        //   end();
        } catch (e) {
          console.log(e);
        }
    });
}

const workerConfig = {  gid: 'workers' };

function compose_crawl_index() {
    distribution.workers.mr.exec({keys: ['urls'], map: mapper, reduce: reducer}, (e, v) => {
        calculate_document_number();
    })
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
                    const urls = [
                        'https://www.gutenberg.org',
                    ]
            
                      console.log("starting crawler")
                    
                      distribution.local.groups.get('workers', (e, group) => {
                        const nodeToUrls = {}
                        for(const node of Object.keys(group)) {
                            nodeToUrls[node] = [];
                        }
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
                                compose_crawl_index();
                            }
                        })
                        }
                    })
                });
            });
        });
    });
}

run();