const mapper = (key, value) => {
    console.log("doing mapper")
    function getURLs(baseURL, html, cb) {
        try {
            const regex = /href=["'](\/[^"']*)["']/g;
            const urls = [...html.matchAll(/href=["'](\/[^"']*)["']/g)].map(match => match[1]);       
            let newURLs = new Set()
            for(const url of urls) {
                let newURL = ''
                if(!url) {
                    continue
                }else if (url.startsWith('about')) {
                    continue
                }else if(url.startsWith('http')) {
                    newURL = url
                    newURLs.add(newURL)
                }else {
                    newURL = baseURL + url
                    newURLs.add(newURL)
                }
            }
            cb(null, newURLs)
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
            distribution.local.mem.get(url, (e, v) => {
                distribution.local.mem.put('', {key: url, gid: 'workers'}, (e, n) => {
                    counter += 1
                    if(!v) {
                        toProcess.push(url)
                    }
                    if(counter == total){
                        const id = require("../util/id")
                        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" 
                        let newURLs = new Set();
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
                                        console.log(e, v)
                                        if (e) return res(e);
                
                                        const newURL = new URL(url);
                                        const baseURL = `${newURL.protocol}//${newURL.hostname}`;
                                        // const baseURL = url.includes('index.html') ? url.substring(0, url.lastIndexOf("index.html")) + '/' : url;
                                        getURLs(baseURL, html, (e, v) => {
                                            if (e) return rej(e);
                                            for (const u of v) newURLs.add({[u]: u});
                                            res();
                                        });
                                    });
                                });
                            })
                            .catch(error => {
                                console.log("error", url)
                                return Promise.resolve()
                            })
                        });
                
                        Promise.all(tasks)
                            .then(() => {
                                resolve([...newURLs]);
                            })
                            .catch(err => {
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