let topics = {'url': ['https://cs.brown.edu/courses/csci1380/sandbox/1/index.html'], 'job': []}
let urlsConsumed = 0

function produce (config, message, cb) {
    if(!topics[config.topic]) {
        topics[config.topic] = []
    }

    if(typeof message == 'string') {
        topics[config.topic].push(message)
    }else if(Array.isArray(message)){ 
        for(const url of message) {
            topics[config.topic].push(url)
        }
    }

    cb(null, null)
}

function consume (config, cb){ 
    const maxBatchSize = 1000

    if(!topics[config.topic]) {
        cb(new Error("This topic does not exist"), null)
        return
    }

    if(topics[config.topic].length == 0){ 
        cb(new Error("There are no messages in this topic"), null)
        return
    }

    const batchSize = Math.min(maxBatchSize, Math.ceil(topics[config.topic].length / 2)) // 3 is hardcoded
    urlsConsumed += batchSize
    console.log('CONSUMED: ', urlsConsumed, '\n\n')
    distribution.local.store.get('urls', (e, v) => {
        let allURLs = []
        if(v) {
            allURLs = [...v]
        }
        if(topics[config.topic].length < batchSize){
            const retVal = topics[config.topic]
            allURLs = [...allURLs, ...retVal]
            distribution.local.store.put(allURLs, 'urls', (e, v) => {
                topics[config.topic] = []
                cb(null, retVal)
                return
            })
        }
    
        const retVal = topics[config.topic].slice(topics[config.topic].length - batchSize, topics[config.topic].length)
        allURLs = [...allURLs, ...retVal]
        distribution.local.store.put(allURLs, 'urls', (e, v) => {
            topics[config.topic] = topics[config.topic].slice(0, topics[config.topic].length - batchSize)
            cb(null, retVal)
            return
        })
    })
}


module.exports = {produce, consume}