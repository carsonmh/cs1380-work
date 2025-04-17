const {JSDOM} = require('jsdom')

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

module.exports = getURLs