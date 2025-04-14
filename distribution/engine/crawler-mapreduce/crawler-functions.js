// const mapper = (key, value) => {
//     let newURLs = new Set([])
//     let iter = 0;
//     for(const url of value) {
//         fetch(url, {
//             method: "GET", 
//             redirect: "follow"
//         })
//         .then(response => response.text())
//         .then((html) => {
//             distribution.local.store.put([{url: html}], {gid: 'crawlGroup', key: id.getID(url)}, (e, v) => {
//                 if(e) {
//                     cb(e, v)
//                     return
//                 }
    
//                 getURLs(url.substring(0, url.lastIndexOf("index.html")) + '/', html, (e, v) => {
//                     if(e) {
//                         cb(e, v)
//                         return
//                     }
    
//                     newURLs = new Set([...v, ...newURLs])
//                     iter += 1
//                     if(iter == value.length) {
//                         console.log(newURLs)
//                     }
//                 })
//             })
//         })
//         .catch(error => {
//             console.log(error)
//             cb(error, [])
//         })
//     }
// }

const mapper = (key, value) => {
    const {JSDOM} = require('jsdom')

    function getURLs(baseURL, html, cb) {
        try {
            const parsedHTML = new JSDOM(html);
            const aTags = parsedHTML.window.document.querySelectorAll('a');
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
        }catch (error) {
            cb(error, null)
        }
    }

    return new Promise((resolve, reject) => {
        const id = require("../util/id")
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" 
        let newURLs = new Set();

        const tasks = value.map(url => {
            return fetch(url, {
                method: "GET", 
                redirect: "follow"
            })
            .then(response => response.text())
            .then(html => {
                return new Promise((res, rej) => {
                    distribution.local.store.put([{ [url]: html }], { gid: 'workers', key: id.getID(url) }, (e, v) => {
                        if (e) return rej(e);

                        const baseURL = url.includes('index.html') ? url.substring(0, url.lastIndexOf("index.html")) + '/' : url;
                        getURLs(baseURL, html, (e, v) => {
                            if (e) return rej(e);
                            for (const u of v) newURLs.add({[u]: u});
                            res();
                        });
                    });
                });
            });
        });

        Promise.all(tasks)
            .then(() => {
                resolve([...newURLs]);
            })
            .catch(err => {
                console.error(err);
                reject(err);
            });
    });
}

const reducer = (key, values) => {
    return values[0]
}

module.exports = { mapper, reducer }