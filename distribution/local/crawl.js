function startCrawler (cb) {
    // const id = require('/home/ubuntu/cs1380-work/distribution/util/id')
    // const distribution = require('/home/ubuntu/cs1380-work/config'))
    const distribution = require('../../config')
    const crawl = require('../engine/crawl')
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
            [{topic: "job"}],
            {node: kafkaNode, service: 'kafka', method: 'consume'},
            (e, v) => {
            if(v && v == 'index') { 
                cb(null, null)
            }else if (!v) {
                distribution.local.comm.send(
                    [{topic: "url"}],
                    {node: kafkaNode, service: 'kafka', method: 'consume'},
                    (e, v) => {
                        if(e) {
                            cb(e, null) // shouldn't error on kafka consume
                            return
                        }

                        doProcessing(v, (e, v) => {
                            if(iteration < 5) { // for now fixed 5 iterations
                                runCrawler((e, v) => {
                                    cb(e, v)
                                })
                            } else {
                                cb(e, v)
                            }
                        })
                })  
            }
        })

    }

    runCrawler((e, v) => {
        cb(e, v); 
        console.log('crawler finished')
    })
}  

module.exports = {startCrawler}