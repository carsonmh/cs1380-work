const id = require('../util/id')

const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== ' ');
    const out = {};
    let totalCount = words.length
    words.forEach((word) => {
      if(out[word]) {
        out[word].itemCount += 1
      }else {
        out[word] = {documentId: key, wordCount: totalCount, itemCount: 1, document: value}
      }
    });

    let res = []
    for(const [key, value] of Object.entries(out)) {
      res.push({[key]: value})
    }

    return res;
}

const reducer = (key, values) => {
    const totalDocuments = 10
    const documentsWithWord = values.length
    const idf = Math.log10(totalDocuments / documentsWithWord * 1.0)

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
    
    return res
}

module.exports = {mapper, reducer}