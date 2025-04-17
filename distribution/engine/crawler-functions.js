const mapper = (key, value, cb) => {
    const {JSDOM} = require("jsdom")
    function getURLs(baseURL, html, cb) {
        try {
            const dom = new JSDOM(html)
            const list = dom.window.document.querySelector('div[class="codes-listing"]');
            if(list) {
                const aTags = list.querySelectorAll('a');
                let newURLs = new Set()
                for(const tag of aTags) {
                    let newURL = ''
                    if(!tag.href) {
                        continue
                    }else if (tag.href.startsWith('about')) {
                        continue
                    }else if(tag.href.startsWith('http')) {
                        newURL = tag.href
                        newURLs.add(newURL)
                    }else { //if(tag.href.startsWith('/')
                        newURL = baseURL + tag.href
                        newURLs.add(newURL)
                    }
                }
                cb(null, newURLs)
            }else {
                cb(null, [])
            }
        }catch (error) {
            cb(error, null)
        }
    }

    function fetchWithCallback(newURLs, url, cb) {
        const id = require('../util/id')
        fetch(url, {
            method: "GET", 
            redirect: "follow"
        })
        .then(response => response.text())
        .then(html => {
            distribution.local.store.put([{ [url]: html }], { gid: 'workers', key: id.getID(url) }, (e, v) => {
                if (e) cb(e, v)

                const newURL = new URL(url);
                const baseURL = `${newURL.protocol}//${newURL.hostname}`;
                // const baseURL = url.includes('index.html') ? url.substring(0, url.lastIndexOf("index.html")) + '/' : url;
                getURLs(baseURL, html, (e, v) => {
                    html = null
                    if (e) return cb(e, null)
                    for (const u of v) newURLs.add(u);
                    cb(null, null)
                });
            });
        })
        .catch(error => {
            cb(error, null)
        })
    }

    if(!value) {
        // distribution.local.store.put([], {key: 'urls-file-1234', gid: 'workers'}, (e, v) => {
            cb(null, [])
        // })
        return
    }

    distribution.local.store.get({key: 'urls-mem-file', gid: 'workers'}, (e, urlsList) => {
        if(urlsList) {
            value = urlsList.concat(value)
        }
        let total = value.length
        let counter = 0;
        let toProcess = [];
        for(const url of value) {
            distribution.local.mem.get(url, (e, v) => {
                counter += 1
                if(!v) {
                    toProcess.push(url)
                }
                if(counter == total){
                    let maxURLs = 100
                    const id = require("../util/id")
                    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" 
                    let newURLs = new Set();
                    let urlsToSave = new Set();
                    if(toProcess.length > maxURLs) {
                        urlsToSave = new Set([...toProcess.slice(maxURLs)])
                        toProcess = toProcess.slice(0, maxURLs);
                    }
                    distribution.local.store.put([...urlsToSave], {key: 'urls-mem-file', gid: 'workers'}, (e, v) => {
                        let i = 0;
                        for(const url of toProcess) {
                            fetchWithCallback(newURLs, url, (e, v) => {
                                distribution.local.mem.put('', {key: url, gid: 'workers'}, (e, n) => {
                                    i += 1
                                    if(i == toProcess.length) {
                                        let arr = []
                                        for(const url of newURLs) {
                                            arr.push({[url]: url})
                                        }
                                        // distribution.local.store.put(arr, {key: 'urls-file-1234', gid: 'workers'}, (e, v) => {
                                        cb(null, arr)
                                        // })
                                    }
                                })
                            })
                        }
                    })
                }
            })
        }
    })
}
const reducer = (key, values) => {
    return values[0]
}

module.exports = { mapper, reducer }