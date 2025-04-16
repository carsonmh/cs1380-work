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
const n4 = { ip: '127.0.0.1', port: 7113 };
const n5 = { ip: '127.0.0.1', port: 7114 };
const n6 = { ip: '127.0.0.1', port: 7115 };
const n7 = { ip: '127.0.0.1', port: 7116 };
const n8 = { ip: '127.0.0.1', port: 7117 };
const n9 = { ip: '127.0.0.1', port: 7118 };
const n10 = { ip: '127.0.0.1', port: 7119 };
const n11 = { ip: '127.0.0.1', port: 7120 };
const n12 = { ip: '127.0.0.1', port: 7121 };
const n13= { ip: '127.0.0.1', port: 7122 };
const n14 = { ip: '127.0.0.1', port: 7123 };
const n15 = { ip: '127.0.0.1', port: 7124 };


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
                // distribution.local.status.spawn(n4, (e, v) => {
                //     distribution.local.status.spawn(n5, (e, v) => {
                //         distribution.local.status.spawn(n6, (e, v) => {
                //             distribution.local.status.spawn(n7, (e, v) => {
                //                 distribution.local.status.spawn(n8, (e, v) => {
                //                     distribution.local.status.spawn(n9, (e, v) => {
                //                         distribution.local.status.spawn(n10, (e, v) => {
                //                             distribution.local.status.spawn(n11, (e, v) => {
                //                                 distribution.local.status.spawn(n12, (e, v) => {
                //                                     distribution.local.status.spawn(n13, (e, v) => {
                //                                         distribution.local.status.spawn(n14, (e, v) => {
                //                                             distribution.local.status.spawn(n15, (e, v) => {
                                                                callback();
                                                            });
                //                                         });
                //                                     });
                //                                 });
                //                             });
                //                         });
                //                     });
                //                 });
                //             });
                //         });
                //     });
                // });
            // });
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
    distribution.workers.mem.get(null, (e, v) => {
        if(v == null) {
            do_tf_idf(0)
            console.log('docs', e, v)
        }else {
            let count = 0
            for(const key of Object.keys(v)){
                count += v[key].length
            }
            do_tf_idf(count);
        }

    });
}

function do_tf_idf(count){

    const serializedReducer = global.distribution.util.serialize(indexReducer);

    const updatedSerializedReducer = serializedReducer.replace('num_docs = 0;', `num_docs = ${count};`);

    let reducertfidf = global.distribution.util.deserialize(updatedSerializedReducer);

    // can't just be URLs becaues it is searching by key -> change to ['indexer'] (this is wrong because the indexer is )
    distribution.workers.mr.exec({keys: ['indexer'], map: indexMapper, reduce: reducertfidf}, (e, v) => {
        try {
            // console.log("indexer output");
            // console.log("Here is error");
            // console.log(e);
            // console.log(v);
            compose_crawl_index();
            // end();
        } catch (e) {
          console.log(e);
        }
    });
}

const workerConfig = {  gid: 'workers' };

function compose_crawl_index() {
    distribution.workers.mr.exec({keys: ['urls'], map: mapper, reduce: reducer}, (e, v) => {
        // console.log("returned with error and then value");
        // console.log(e);
        // console.log(v);
        calculate_document_number();
    })
}

function run() {
    distribution.node.start((server) => {
        localServer = server;

        workerGroup[id.getSID(n1)] = n1;
        workerGroup[id.getSID(n2)] = n2;
        workerGroup[id.getSID(n3)] = n3;
        // workerGroup[id.getSID(n4)] = n4;
        // workerGroup[id.getSID(n5)] = n5;
        // workerGroup[id.getSID(n6)] = n6;
        // workerGroup[id.getSID(n7)] = n7;
        // workerGroup[id.getSID(n8)] = n8;
        // workerGroup[id.getSID(n9)] = n9;
        // workerGroup[id.getSID(n10)] = n10;
        // workerGroup[id.getSID(n11)] = n11;
        // workerGroup[id.getSID(n12)] = n12;
        // workerGroup[id.getSID(n13)] = n13;
        // workerGroup[id.getSID(n14)] = n14;
        // workerGroup[id.getSID(n15)] = n15;

        startNodes(() => {
            // this is just for testing purposes only 
            distribution.local.groups.put(workerConfig, workerGroup, (e, v) => {
                distribution.workers.groups.put(workerConfig, workerGroup, (e, v) => {
                    // start the crawling
                    const urls = [
                        'https://law.justia.com/codes/alabama/2024/',
                    ]
            
                    //   console.log("starting crawler")
                    
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
                        // console.log("here is the node to urls");
                        // console.log(nodeToUrls);
                        // console.log("here is current node");
                        // console.log(distribution.node);
                    
                        for(const [key, value] of Object.entries(nodeToUrls)) {
                          const remote = {node: group[key], service: 'store', method: 'put'}
                        //   console.log("putting value/it on this node");
                        //   console.log(value);
                        //   console.log(group[key]);
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