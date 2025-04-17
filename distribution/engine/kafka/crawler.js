function startCrawler () {
    const id = require('../../util/id')
    const distribution = require('../../../config')
    const crawl = require('./doCrawl')
    const kafkaNode = {ip: '127.0.0.1', port: 9001} // Fill in with the kafkaNode info

    const https = require('https');
    const agent = new https.Agent({
        rejectUnauthorized: false
    })

    console.log("starting...")

    function doProcessing(urls, cb) {
        let i = 0;
        for(const url of urls) {
            crawl(url, (e, v) => {
                distribution.local.comm.send(
                    [{topic: "url"}, v],
                    {node: kafkaNode, service: 'kafka', method: 'produce'},
                    (e, v) => {
                        i += 1
                        if(i == urls.length) {
                            cb(e, v)
                        }
                        
                    }
                )
            })
        }
    }

    let iteration = 0

    function runCrawler(cb) {
        iteration += 1
        distribution.local.comm.send(
            [{topic: "url"}],
            {node: kafkaNode, service: 'kafka', method: 'consume'},
            (e, v) => {
                if(e) {
                    runCrawler((e, v) => {
                        console.log(e, v)
                    })
                    return
                }
    
                doProcessing(v, (e, v) => {
                    console.log(iteration)
                    if(iteration < 10) {
                        runCrawler((e, v) => {
                            console.log(e, v)
                        })
                    } 
                })
        })

    }

    const startingUrl = 'https://law.justia.com/codes/alabama/2024/'
    distribution.local.comm.send(
        [{topic: "url"}, [startingUrl, id.getSID(distribution.node)]],
        {node: kafkaNode, service: 'kafka', method: 'produce'},
        (e, v) => {
            runCrawler((e, v) => {})  
        })
}  

const distribution = require('../../../config.js')

// module.exports = startCrawler
global.nodeConfig = {
    ip: '127.0.0.1',    
    port: 7000,
    onStart: () => {
        console.log(`Node started!`);
    },
}
  
distribution.node.start((server) => {
    localServer = server;
    startCrawler()
}); 
