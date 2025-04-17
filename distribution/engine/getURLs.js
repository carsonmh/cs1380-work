const {JSDOM} = require('jsdom')

function getURLs(baseURL, html, cb) {
    try {
        const parsedHTML = new JSDOM(html);
        const aTags = parsedHTML.window.document.querySelectorAll('a');
        parsedHTML.window.close()
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
        console.log(error)
        cb(error, null)
    }
}

module.exports = getURLs