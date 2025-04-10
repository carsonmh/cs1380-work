const fs = require('fs');
const path = require('path');
const distribution = require('../../config.js');
const id = distribution.util.id;
let localServer = null;

const tfidfGroup = {};

const n1 = { ip: '127.0.0.1', port: 7110 };
const n2 = { ip: '127.0.0.1', port: 7111 };
const n3 = { ip: '127.0.0.1', port: 7112 };

const tfidfConfig = { gid: 'tfidf' };

const query = process.argv.slice(2).join(' ').toLowerCase().replace(/[^\w\s]/g, '').trim();

if (!query) {
    console.log('Please provide a query as an argument.');
    process.exit(1);
}

const queryTerms = query.split(/\s+/);

const results = {};

function end() {
    localServer.close();
}

function do_the_query() {

    distribution.local.groups.get('tfidf', (err, group) => {
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
            const hashedNode = id.consistentHash(id.getID(term), groupKeys);
            nodeToWords[hashedNode].push(term);
        }

        
        for (const [nodeKey, words] of Object.entries(nodeToWords)) {
            const port = group[nodeKey].port;

            for (const word of words) {
                const tfidfPath = path.join(`store/${port}/tfidf/${word}.txt`);

                if (fs.existsSync(tfidfPath)) {
                    try {
                        const raw = fs.readFileSync(tfidfPath, 'utf8');
                        const deserialized = distribution.util.deserialize(raw); 

                        deserialized.forEach(([url, score]) => {
                            if (!results[url]) {
                                results[url] = 0;
                            }
                            results[url] += score;
                        });

                    } catch (e) {
                        console.error(`Error reading ${tfidfPath}:`, e);
                    }
                } else {
                    console.warn(`Word "${word}" not found on node with port ${port}`);
                }
            }
        }

        const sorted = Object.entries(results)
            .sort((a, b) => b[1] - a[1]) 
            .map(entry => entry[0]);

        console.log("Relevant URLs for query:", query);
        console.log(sorted);
        end();
    });
}

function run() {

    // EDIT THIS FILE WHEN WE ACTUALLY RUN IT TO INCLUDE ALL NODES THAT WERE INVOLVED IN THE TF-IDF Calculation
    distribution.node.start((server) => {

        localServer = server;

        tfidfGroup[id.getSID(n1)] = n1;
        tfidfGroup[id.getSID(n2)] = n2;
        tfidfGroup[id.getSID(n3)] = n3;

        distribution.local.groups.put(tfidfConfig, tfidfGroup, (e, v) => {
            do_the_query();
        });

    });

}

run();