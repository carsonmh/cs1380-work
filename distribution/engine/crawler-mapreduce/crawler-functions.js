const mapper = (key, value) => {
    const {JSDOM} = require('jsdom')

    function getURLs(baseURL, html, cb) {
        try {

            const regex = /href=["'](\/[^"']*)["']/g;
            const urls = [...html.matchAll(/href=["'](\/[^"']*)["']/g)].map(match => match[1]);            const parsedHTML = new JSDOM(html, {
                resources: "usable",
                runScripts: "outside-only",
            });

            const aTags = parsedHTML.window.document.querySelectorAll('a');
            let newURLs = new Set()
            for(const tag of aTags) {
                // console.log(tag.href)
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
        }catch (error) {
            cb(error, null)
        }
    }


    return new Promise((resolve, reject) => {
        const id = require("../util/id")
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" 
        let newURLs = new Set();
        let tasks;


        distribution.local.mem.get(key, (e, v) => {
            distribution.local.mem.put(key, '', (e, n) => {
                if(value && !v) {
                    tasks = value.map(async url => {
                        return fetch(url, {
                            method: "GET", 
                            redirect: "follow"
                        })
                        .then(response => response.text())
                        .then(html => {
                            return new Promise((res, rej) => {
                                distribution.local.store.put([{ [url]: html }], { gid: 'workers', key: id.getID(url) }, (e, v) => {
                                    if (e) return res(e);
            
                                    const baseURL = url.includes('index.html') ? url.substring(0, url.lastIndexOf("index.html")) + '/' : url;
                                    getURLs(baseURL, html, (e, v) => {
                                        if (e) return rej(e);
                                        for (const u of v) newURLs.add({[u]: u});
                                        res();
                                    });
                                });
                            });
                        })
                        .catch(error => {
                            return new Promise((res, rej) => {
                                res()
                            })
                        })
                    });
                }else {
                    tasks = [];
                }

                Promise.all(tasks)
                    .then(() => {
                        resolve([...newURLs]);
                    })
                    .catch(err => {
                        reject(err);
                    });
                })
        })
    });
}

const reducer = (key, values) => {
    return values[0]
}

module.exports = { mapper, reducer }