const indexMapper = (key, value) => {
    const { JSDOM } = require('jsdom');
    console.log(key, value);
    const out = {};
    for (const val of value) {
        const firstKey = Object.keys(val)[0];
        // first key of value
        const dom = new JSDOM(val[firstKey]);
        const textContent = dom.window.document.body.textContent;
        // console.log("here is text content");
        // console.log(textContent);
        const cleanText = textContent.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').toLowerCase();
        const words = cleanText.split(' ').filter((e) => e.length > 0);
        // console.log("here are words");
        // console.log(words);
        
        let totalCount = words.length;
        words.forEach((word) => {
          if(out[word]) {
            out[word].itemCount += 1
          }else {
            out[word] = {documentId: firstKey, wordCount: totalCount, itemCount: 1, document: value}
          }
        });
    }

    let res = []
    for(const [key, value] of Object.entries(out)) {
      res.push({[key]: value})
    }

    // return res; -> previous non promise map reduce 
    return new Promise((resolve, reject) => {
        try {
            resolve(res);
        } catch (err) {
            reject(err);
        }
    });
};

// Reduce function: calculate TF-IDF for each word
let indexReducer = (key, values) => {
    const fs = require('fs');
    const path = require("path");
    console.log("IN REDUCER - here is key");
    console.log(key);
    console.log("IN REDUCER - here is value");
    console.log(values);
    function isValidURL(str) {
        try {
            new URL(str);
            return true;
        } catch (_) {
            return false;
        }
    };
    if (isValidURL(key)) {
        return;
    }
    const num_docs = 0;

    const documentsWithWord = values.length;

    const idf = Math.log10( num_docs/ documentsWithWord * 1.0)

    let res = {}

    for(const value of values) {
      const amountOfTimesItem = value.itemCount
      const totalAmountOfItems = value.wordCount
      const tf = amountOfTimesItem / totalAmountOfItems * 1.0

      if(!res[key]) {
        res[key] = {}
      }

      res[key][value.documentId] = Math.round((tf * idf) * 100) / 100;
    }

    for (const word in res) {

        const docScores = res[word]; 

        const outputArray = Object.entries(docScores).map(([docID, score]) => {
          const url = global.urlMap?.[docID] || docID;
          return [url, score];
        });
      
        const serializedData = global.distribution.util.serialize(outputArray);
      
        const dirPath = `store/${global.distribution.node.config.port}/workers`;

        fs.mkdirSync(dirPath, { recursive: true });
        
        const filePath = path.join(dirPath, `${word}.txt`);

        fs.writeFileSync(filePath, serializedData, 'utf8');
    }
    return res
};

module.exports = {indexMapper, indexReducer}