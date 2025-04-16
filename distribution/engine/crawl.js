const getURLs = require("./getURLs")
const id = require('../util/id')

function crawl(url, cb) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // TODO: make this more secure

    distribution.local.mem.get(id.getID(url), (e, v) => {
        if(!v) {
            distribution.local.mem.put(id.getID(url), null, (e, v) => {
                fetch(url, {
                    method: "GET", 
                    redirect: "follow"
                })
                .then(response => response.text())
                .then((html) => {
                    distribution.local.store.put(html, {gid: 'crawlGroup', key: id.getID(url)}, (e, v) => {
                        if(e) {
                            cb(e, v)
                            return
                        }

                        getURLs(url.substring(0, url.lastIndexOf("index.html")) + '/', html, (e, v) => {
                            if(e) {
                                cb(e, v)
                                return
                            }

                            newURLs = new Set([...v])
                            cb(null, [...newURLs])
                        })
                    })
                })
                .catch(error => {
                    cb(error, [])
                })
            })
        }else {
            cb(null, [])
        }
    })
}

module.exports = crawl