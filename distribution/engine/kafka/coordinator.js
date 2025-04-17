const readline = require('readline');
const distribution = require('../../../config')
const id = distribution.util.id;
const args = require('yargs').argv;

const {indexReducer, indexMapper} = require('../indexer')

const kafkaNode = {ip: '172.31.30.7', port: 9001}

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
        rl.question('Enter worker node IP and port (IP:PORT)', (answer) => {
        if (answer.trim() === '') {
            rl.close();
            resolve(workerNodes);
        } else {
            const [ip, port] = answer.split(':');
            if (ip && port) {
            workerNodes.push({ ip: ip.trim(), port: parseInt(port.trim()) });
            askForNode();
            } else {
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

    if (workerNodes.length === 0) {
        process.exit(1);
    }

    // Populate crawlGroupGroup with the provided worker nodes
    workerNodes.forEach(node => {
        crawlGroupGroup[id.getID(node)] = node;
    });

    const crawlGroupConfig = {gid: 'workers'};
    distribution.local.groups.put(crawlGroupConfig, crawlGroupGroup, (e, v) => {
        distribution.workers.groups.put(crawlGroupConfig, crawlGroupGroup, (e, v) => {
        distribution.local.comm.send([crawlGroupConfig, crawlGroupGroup], {service: 'groups', method: 'put', node: kafkaNode}, (e, v) => {
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

    
            distribution.local.comm.send(
            [{topic: "url"}, urls],
            {node: kafkaNode, service: 'kafka', method: 'produce'},
            (e, v) => {
                run((e, v) => {
                    console.log("done")
                })
            })
        })
    });
})
}

let iterations = 0;
let numIterations = args.iterations ? args.iterations : 1;
let startTime;

function run(cb) {
    distribution.workers.crawl.runCrawler([{config: 'bro'}], (e, v) => {
        console.log('crawler done')

        distribution.local.comm.send([{config: 'bro'}], {node: kafkaNode, service: 'kafka', method: 'getTotalUrls'}, (e, v) => {
            let count = v
            console.log("count: ", count)

            const serializedReducer = global.distribution.util.serialize(indexReducer);
            const updatedSerializedReducer = serializedReducer.replace('numDocs = 0;', `numDocs = ${count};`);
            let reducertfidf = global.distribution.util.deserialize(updatedSerializedReducer);
            
            distribution.workers.mr.exec({keys: ['indexer'], map: indexMapper, reduce: reducertfidf}, (e, v) => {
                if(e) {
                    console.log(e, v)
                }

                if(iterations < numIterations) {
                    if(count >= 1000) {
                        cb(null, null)
                        let endTime = performance.now()
                        console.log(endTime - startTime)
                        return
                    }
                    iterations += 1
                    console.log('crawled: ', count)
                    run(cb)
                } else {
                    let endTime = performance.now()
                    console.log(endTime - startTime)
                    console.log("stopping for now...")
                }
            })
        })
        })
}
    
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