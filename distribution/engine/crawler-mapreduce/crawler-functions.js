const mapper = (key, value) => {
    const {JSDOM} = require('jsdom')

    function getURLs(baseURL, html, cb) {
        try {
            const parsedHTML = new JSDOM(html);
            // const parsedHTML = new JSDOM(html, {
            //     url: "https://www.gutenberg.org",
            // });
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
        // console.log("HERE IS THE VALUE");
        // console.log(value);
        // console.log("here is the key");
        // console.log(key);
        const tasks = value.map(url => {
            return fetch(url, {
                method: "GET", 
                redirect: "follow"
            })
            .then(response => response.text())
            .then(html => {
                return new Promise((res, rej) => {
                    // console.log("here is html");
                    // console.log(html);
                    // console.log("here is url");
                    // console.log(url);
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
                // console.log(global.distribution.node);
                reject(err);
            });
    });
}

const reducer = (key, values) => {
    return values[0]
}

module.exports = { mapper, reducer }