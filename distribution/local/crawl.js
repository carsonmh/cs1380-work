const doCrawl = require('../engine/kafka/doCrawl')
const kafkaNode = {ip: '172.31.30.7', port: 9001} // Fill in with the kafkaNode info
const id = require("../util/id")

const https = require('https');

function startCrawl(message, cb) {
    function doProcessing(urls, cb) {
        let i = 0;
        if(urls.length == 0){ 
            cb(null, null)
            return
        }

        for(const url of urls) {
            doCrawl(url, (e, v) => {
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
        distribution.local.comm.send(
            [{topic: "url", node: id.getID(distribution.node.config)}],
            {node: kafkaNode, service: 'kafka', method: 'consume'},
            (e, v) => {
                if(e) {
                    cb(e, v)
                    return
                }
    
                doProcessing(v, (e, v) => {
                    iteration += 1
                    if(iteration < 5){
                        runCrawler((e, v) => {cb(e, v)})
                    }else {
                        cb(null, null)
                    }
                })
        })

    }

    runCrawler((e, v) => {
        cb(e, v)
    }) 
} 

module.exports = {startCrawl}