const getURLs = require("./getURLs")
const id = require('../../util/id')

const kafkaNode = {ip: '127.0.0.1', port: 9001}

function doCrawl(url, cb) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // TODO: make this more secure
    fetch(url, {
        method: "GET", 
        redirect: "follow"
    })
    .then(response => response.text())
    .then((html) => {
        distribution.local.store.put([{ [url]: html }], { gid: 'workers', key: id.getID(url) }, (e, v) => {
        if(e) {
            cb(e, v)
            return
        }
        const newURL = new URL(url);
        const baseURL = `${newURL.protocol}//${newURL.hostname}`;
        getURLs(baseURL, html, (e, v) => {
            if(e) {
                cb(e, v)
                return
            }

            let newURLs = new Set([...v])
            cb(null, [...newURLs])
        })
    })
    })
    .catch(error => {
        cb(error, [])
    })
}

module.exports = doCrawl