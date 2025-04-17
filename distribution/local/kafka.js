const { id } = require("../util/util");

let topics = { 'url': {} };
let batchSize = 50;
let urlsConsumed = 0;

function produce(config, message, cb) {
    if (config.topic !== 'url') {
        cb(null, null);
        return;
    }

    distribution.local.groups.get('workers', (err, group) => {
        let i = 0;
        if(message.length == 0) {
            cb(null, null);
            return
        }
        for (const url of message) {
            distribution.local.mem.get(url, (e, v) => {
                if(!v) {
                    distribution.local.mem.put('', url, (e, v) => {
                        let hash = id.getID(url);
                        const node = id.rendezvousHash(hash, Object.keys(group));
                        if(!topics['url'][node]){
                            topics['url'][node] = []
                        }
                        topics['url'][node].push(url);
                        if(i == message.length) {
                            cb(null, null)
                        }
                    })
                }else {
                    console.log("url found")
                    i += 1
                    if(i == message.length) {
                        cb(null, null)
                    }
                }
            })
        }
    });
}

function consume(config, cb) {
    if (config.topic !== 'url') {
        cb(new Error("Unsupported topic"), null);
        return;
    }

    distribution.local.groups.get('workers', (err, group) => {
        // console.log('CONSUMED: ', urlsConsumed, '\n\n');

        // distribution.local.mem.get(null, (err, storedURLs) => {
            // let allURLs = storedURLs || [];
            // const node = id.rendezvousHash(hash, Object.keys(group));
            const node = config.node;
            let allURLs = [];
            if(!topics['url'][node]) {
                topics['url'][node] = []
            }
            let toSend = topics['url'][node].splice(0, batchSize);
            allURLs.push(...toSend);
            urlsConsumed += toSend.length;

            // distribution.local.mem.put(allURLs, 'urls', (err) => {
            cb(null, toSend);
            // });
        });
    // });
}

function getTotalUrls(message, cb) {
    console.log(urlsConsumed)
    cb(null, urlsConsumed)
}
module.exports = { produce, consume, getTotalUrls };
