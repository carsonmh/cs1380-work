const fs = require('fs');
const path = require('path');
const distribution = require('../../config.js');
const id = distribution.util.id;
let localServer = null;
// const levenshtein = require('fast-levenshtein');

const tfidfGroup = {};

const n1 = { ip: '172.31.28.223', port: 8000 };
// const n2 = { ip: '127.0.0.1', port: 7111 };
// const n3 = { ip: '127.0.0.1', port: 7112 };

// const n1 = { ip: '127.0.0.1', port: 8000 };

const tfidfConfig = { gid: 'workers' };

const query = process.argv.slice(2).join(' ').toLowerCase().replace(/[^\w\s]/g, '').trim();

if (!query) {
    console.log('Please provide a query as an argument.');
    process.exit(1);
}

const queryTerms = query.split(/\s+/);

const results = {};

function end() {
    // localServer.close();
    // const remote = {service: 'status', method: 'stop'};
    // remote.node = n1;
    // distribution.local.comm.send([], remote, (e, v) => {
    //   remote.node = n2;
    //   distribution.local.comm.send([], remote, (e, v) => {
    //     remote.node = n3;
    //     distribution.local.comm.send([], remote, (e, v) => {
                localServer.close();
    //         });
    //     });
    // });
}

function getSuggestions(target, allWords) {
    const suggestions = allWords
        .map(word => ({ word, dist: levenshtein.get(target, word) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3); 
    return suggestions.map(s => s.word);
}

// function do_the_query() {

//     distribution.local.groups.get('workers', (err, group) => {
//         if (err) {
//             console.error('Error getting group:', err);
//             process.exit(1);
//         }

//         const nodeToWords = {};
//         const groupKeys = Object.keys(group);

        
//         for (const nodeKey of groupKeys) {
//             nodeToWords[nodeKey] = [];
//         }

//         for (const termRaw of queryTerms) {
//             const term = termRaw.toLowerCase().replace(/[^\w]/g, '');
//             if (term.length === 0) continue;
//             const hashedNode = id.consistentHash(id.getID(term), groupKeys);
//             nodeToWords[hashedNode].push(term);
//         }

        
//         for (const [nodeKey, words] of Object.entries(nodeToWords)) {
//             const port = group[nodeKey].port;

//             for (const word of words) {
//                 const tfidfPath = path.join(`store/${port}/workers/${word}.txt`);

//                 if (fs.existsSync(tfidfPath)) {
//                     try {
//                         const raw = fs.readFileSync(tfidfPath, 'utf8');
//                         const deserialized = distribution.util.deserialize(raw); 

//                         deserialized.forEach(([url, score]) => {
//                             if (!results[url]) {
//                                 results[url] = 0;
//                             }
//                             results[url] += score;
//                         });

//                     } catch (e) {
//                         console.error(`Error reading ${tfidfPath}:`, e);
//                     }
//                 } else {
//                     console.warn(`Word "${word}" not found on node with port ${port}`);
//                 }
//             }
//         }

//         const sorted = Object.entries(results)
//             .sort((a, b) => b[1] - a[1]) 
//             .map(entry => entry[0]);

//         console.log("Relevant URLs for query:", query);
//         console.log(sorted);
//         end();
//     });
// }

function do_the_query() {

    distribution.local.groups.get('workers', (err, group) => {
        if (err) {
            console.error('Error getting group:', err);
            process.exit(1);
        }

        const nodeToWords = {};
        const groupKeys = Object.keys(group);

        for (const nodeKey of groupKeys) {
            nodeToWords[nodeKey] = [];
        }

        for (const termRaw of queryTerms) {
            const term = termRaw.toLowerCase().replace(/[^\w]/g, '');
            if (term.length === 0) continue;
            const hashedNode = id.rendezvousHash(id.getID(term), groupKeys);
            nodeToWords[hashedNode].push(term);
        }

        let totalWords = queryTerms.length;
        let completed = 0;

        for (const [nodeKey, words] of Object.entries(nodeToWords)) {
            const node = group[nodeKey];

            

            for (const word of words) {
                const remote = {
                    node: node,
                    service: 'store',
                    method: 'get',
                    // gid: 'workers'
                };

                const configuration = {key: word, gid: "workers"};
                console.log("about to send")
                distribution.local.comm.send([configuration], remote, (err, value) => {
                    console.log(err, value)
                    completed++;
                    
                  
                    if (!err && Array.isArray(value)) {
                      try {
                        for (const result of value) {
                            if (!Array.isArray(result) || result.length < 2) continue;
                    
                            const urlObj = result[0];
                            const tfidfObj = result[1];
                            
                        
                            if (urlObj && tfidfObj) {
                                if (!results[urlObj]) {
                                    results[urlObj] = tfidfObj;
                                } else {
                                    results[urlObj] += tfidfObj;
                                }
                            }
                            
                        }
                  
                      } catch (e) {
                        
                        console.error(`Error processing word "${word}" from node ${node.port}`, e);
                      }
                    } else {

                        // console.log("here is the error");
                        // console.log(err);
                        // console.log("here is teh value");
                        // console.log(value);
                        // console.warn(`Word "${word}" not found or failed on node ${node.port}`);
                        // Word not found — try suggestion from the node
                        // const keyConfig = { gid: "workers", key: null };
                        // const keyRemote = {
                        //     node: node,
                        //     service: 'store',
                        //     method: 'get'
                        // };

                        // distribution.local.comm.send([keyConfig], keyRemote, (errKeys, keys) => {
                        // // distribution.workers.store.get(null, (errKeys, keys) => { // suggestions for all of the keys 
                        //     if (!errKeys && Array.isArray(keys)) {
                        //         const suggestions = getSuggestions(word, keys.map(k => k.value || k));
                        //         console.warn(`Word "${word}" not found on node ${node.port}. Did you mean: ${suggestions.join(', ')}?`);
                        //     } else {
                        //         console.warn(`Word "${word}" not found and couldn't fetch suggestions from node ${node.port}.`);
                            // }

                            // if (completed === totalWords) {
                            //     const sorted = Object.entries(results)
                            //         .sort((a, b) => b[1] - a[1])
                            //         .map(entry => entry[0]);

                            //     console.log("Relevant URLs for query:", query);
                            //     console.log(sorted);
                            //     end();
                            // }
                        // });
                        // return; // early return to prevent double-callback?????
                    }
                  
                    if (completed === totalWords) {
                      const sorted = Object.entries(results)
                        .sort((a, b) => b[1] - a[1])
                        .map(entry => entry[0]);
                  
                      console.log("Relevant URLs for query:", query);
                      console.log(sorted.length > 5 ? sorted.slice(0, 5) : sorted);
                      end();
                    }
                });                                    
            }
        }
    });
}


function run() {

    // EDIT THIS FILE WHEN WE ACTUALLY RUN IT TO INCLUDE ALL NODES THAT WERE INVOLVED IN THE TF-IDF Calculation
    distribution.node.start((server) => {

        localServer = server;

        tfidfGroup[id.getSID(n1)] = n1;
        // tfidfGroup[id.getSID(n2)] = n2;
        // tfidfGroup[id.getSID(n3)] = n3;

        distribution.local.groups.put(tfidfConfig, tfidfGroup, (e, v) => {
            distribution.workers.groups.put(tfidfConfig, tfidfGroup, (e, v) => {

            // spawn the nodes 
                // distribution.local.status.spawn(n1, (e, v) => {
                //     distribution.local.status.spawn(n2, (e, v) => {
                //         distribution.local.status.spawn(n3, (e, v) => {
                do_the_query();
                //         });
                //     });
                // });
            });
        });

    });

}

run();