// let index_list = [];

const indexMapper = (key, value) => {
  const { JSDOM } = require('jsdom');
  
  const out = {};
  const mapping = value[0]
  const firstKey = Object.keys(mapping)[0];
  const dom = new JSDOM(mapping[firstKey]);

  let textContent = dom.window.document.body.textContent;
  let cleanText = textContent.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').toLowerCase();
  function isNumberGt5Digits(str) {
    if (/^-?\d+$/.test(str)) {
        return str.replace(/^-/, '').length > 4;
    }
    return false;
  }

  dom.window.close()

  let words = cleanText.split(' ').filter((e) => e.length > 0);
  
  let totalCount = words.length;
  words.forEach((word) => {
    if(out[word]) {
      out[word].itemCount += 1
    }else {
      out[word] = {documentId: firstKey, wordCount: totalCount, itemCount: 1} // deleted document: value
    }
  })

  for(const [key, value] of Object.entries(out)){ 
    out[key] = {documentId: out[key].documentId, tf: out[key].itemCount / (out[key].wordCount * 1.0)}
  }

  words = null
  cleanText = null
  textContent = null


  let res = []
  for(const [key, value] of Object.entries(out)) {
    res.push({[key]: value})
  }

  Object.keys(out).forEach(key => delete out[key]);

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

      if(v) {
        for(const value of v) {
          const tf = value[2];
          if(!res[key]) {
            res[key] = {}
          }
          res[key][value[0]] = [Math.round((tf * idf) * 10000) / 10000, tf];
        }
        v = null // garbage collection
      }
  
      for(const value of values) {
        const tf = value.tf;

  
        if(!res[key]) {
          res[key] = {}
        }
  
        res[key][value.documentId] = [Math.round((tf * idf) * 10000) / 10000, tf]
      }

      values = null // garbage collection
  
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