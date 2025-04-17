const mapper = (key, value) => {
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

    if(!value) {
        return new Promise((res, rej) => {res([])})
    }

    return new Promise((resolve, reject) => { 
        let total = value.length
        let counter = 0;
        let toProcess = [];
        for(const url of value) {
            distribution.local.store.get(url, (e, v) => {
                distribution.local.store.put('', {key: url, gid: 'workers'}, (e, n) => {
                    counter += 1
                    if(!v) {
                        toProcess.push(url)
                    }
                    if(counter == total){
                        let maxURLs = 250
                        const id = require("../util/id")
                        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" 
                        let newURLs = new Set();
                        if(toProcess.length > maxURLs) {
                            newURLs = new Set([...toProcess.slice(maxURLs)])
                            toProcess = toProcess.slice(0, maxURLs);
                        }
                        let tasks;
                        tasks = toProcess.map(async url => {
                            return fetch(url, {
                                method: "GET", 
                                redirect: "follow"
                            })
                            .then(response => response.text())
                            .then(html => {
                                return new Promise((res, rej) => {
                                    distribution.local.store.put([{ [url]: html }], { gid: 'workers', key: id.getID(url) }, (e, v) => {
                                        if (e) return res(e);
                
                                        const newURL = new URL(url);
                                        const baseURL = `${newURL.protocol}//${newURL.hostname}`;
                                        // const baseURL = url.includes('index.html') ? url.substring(0, url.lastIndexOf("index.html")) + '/' : url;
                                        getURLs(baseURL, html, (e, v) => {
                                            html = null
                                            if (e) return rej(e);
                                            for (const u of v) newURLs.add({[u]: u});
                                            res();
                                        });
                                    });
                                });
                            })
                            .catch(error => {
                                return Promise.resolve()
                            })
                        });
                
                        Promise.all(tasks)
                            .then(() => {
                                resolve([...newURLs]);
                            })
                            .catch(err => {
                                console.log(err)
                                reject(err);
                            });
                    }
                })
            })
        }
    })
}
const reducer = (key, values) => {
    return values[0]
}

module.exports = { mapper, reducer }