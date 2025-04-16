// let index_list = [];

const indexMapper = (key, value) => {
  const { JSDOM } = require('jsdom');
  
  const out = {};
  const mapping = value[0]
  const firstKey = Object.keys(mapping)[0];
  const dom = new JSDOM(mapping[firstKey]);

  const textContent = dom.window.document.body.textContent;
  const cleanText = textContent.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').toLowerCase();
  const words = cleanText.split(' ').filter((e) => e.length > 0);
  
  let totalCount = words.length;
  words.forEach((word) => {
    if(out[word]) {
      out[word].itemCount += 1
    }else {
      out[word] = {documentId: firstKey, wordCount: totalCount, itemCount: 1} // deleted document: value
    }
  })

  let res = []
  for(const [key, value] of Object.entries(out)) {
    res.push({[key]: value})
  }

  return new Promise((resolve, reject) => {
      resolve(res);
  });
};

// Reduce function: calculate TF-IDF for each word
let indexReducer = (key, values) => {
  distribution.local.store.get({key: key, gid: 'workers'}, (e, v) => {
      const numDocs = 0;
  
      let documentsWithWord = values.length;
      if(v) {
        documentsWithWord += v.length
      }
  
      const idf = Math.log10((numDocs + 1) / ((documentsWithWord *1.0) + 1)) // smoothed IDF
  
      let res = {}
  
      for(const value of values) {
        const amountOfTimesItem = value.itemCount
        const totalAmountOfItems = value.wordCount
        const tf = amountOfTimesItem / (totalAmountOfItems * 1.0)

  
        if(!res[key]) {
          res[key] = {}
        }
  
        res[key][value.documentId] = [Math.round((tf * idf) * 10000) / 10000, tf]
      }
  
      if(v) {
        for(const value of v) {
          if(value == undefined){ 
            console.log(v, key, value)
          }
          const tf = value[2];
          if(!res[key]) {
            res[key] = {}
          }
          res[key][value[0]] = [Math.round((tf * idf) * 10000) / 10000, tf];
        }
      }
  
      let i = 0;
      for (const word in res) {
  
          const docScores = res[word]; 
  
          const outputArray = Object.entries(docScores).map(([docID, score]) => {
            return [docID, score[0], score[1]];
          });

          distribution.local.store.put(outputArray, {key: word, gid: 'workers'}, (e, v) => {
            i += 1
            if(i == res.length) {
              return res  
            }
          })
      }
  })
};

module.exports = {indexMapper, indexReducer}