function startCrawler () {
    // const id = require('/home/ubuntu/cs1380-work/distribution/util/id')
    // const distribution = require('/home/ubuntu/cs1380-work/config'))
    const distribution = require('/usr/src/app/stencil/config')
    const crawl = require('/usr/src/app/stencil/distribution/engine/crawl')
    // const fetch = require('node-fetch')
    const kafkaNode = {ip: '127.0.0.1', port: 9001} // Fill in with the kafkaNode info

    const https = require('https');
    const agent = new https.Agent({
        rejectUnauthorized: false
    })

    function doProcessing(urls, cb) {
        for(const url of urls) {
            crawl(url, (e, v) => {
                distribution.local.comm.send(
                    [{topic: "url"}, v],
                    {node: kafkaNode, service: 'kafka', method: 'produce'},
                    (e, v) => {
                        cb(e, v)
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
                    if(iteration < 10) {
                        runCrawler((e, v) => {
                            console.log(e, v)
                        })
                    } 
                })
        })

    }

    runCrawler((e, v) => {})

    function runNextJob() {
        distribution.local.comm.send(
        [{topic: "job"}],
        {node: kafkaNode, service: 'kafka', method: 'consume'},
        (e, v) => {
            runCrawler((e, v) => {
                console.log(e, v)
            })
        })
    }
}  

module.exports = startCrawler