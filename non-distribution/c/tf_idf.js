// #!/usr/bin/env node
// go through the global/local index, get the URLs, extract the text from the URLs, then have a counter and count the
// tf-idf calculation for each word and finally then write that to a new document which has the new tf-idf values

const fs = require('fs');
const axios = require('axios');
const {execSync} = require('child_process');
const natural = require('natural');
const {URL} = require('url');
const https = require('https');

const globalTerms = new Set();
const termFrequency = {}; // termFrequency[url] = { term -> count }
let documentCount = 0;
const wrd2idx = {};
const url_to_idx = {}; // url -> index in array
const idx_to_url = {};

const agent = new https.Agent({
  rejectUnauthorized: false,
});


async function extractTextFromUrl(url) {
  try {
    const response = await axios.get(url, {httpsAgent: agent});
    const htmlContent = response.data;
    let text = execSync(`echo "${htmlContent}" | ./../getText.js`, {encoding: 'utf-8'}).trim();

    text = execSync(`echo "${text}" | ./../stem.js`, {encoding: 'utf-8'}).trim();

    text = text.toLowerCase();

    return text;
  } catch (error) {
    console.error(`Error fetching URL: ${url}`, error);
    return null;
  }
}

function generate_grams(text, url) {
  // if it does not exist
  if (!termFrequency[url]) {
    url_to_idx[url] = documentCount;
    idx_to_url[documentCount] = url;
    documentCount += 1; // new document
    termFrequency[url] = {};
  }

  const ngrams = execSync(`echo "${text}" | ./../combine.sh`, {encoding: 'utf-8'}).trim();

  const ngramArray = ngrams.split('\n');
  // populate the list
  for (const gram of ngramArray) {
    globalTerms.add(gram);
    if (gram in termFrequency[url]) {
      termFrequency[url][gram] += 1;
    } else {
      termFrequency[url][gram] = 1;
    }
  }

  // return ngrams;
}

function idfMatrix() {
  const idf = new Array(globalTerms.length).fill(0);

  const wordDocCount = new Map();

  for (const url in termFrequency) {
    for (const word in termFrequency[url]) {
      if (wordDocCount[word]) {
        wordDocCount[word] +=1;
      } else {
        wordDocCount[word] = 1;
      }
    }
  }
  // console.log(wordDocCount);


  index = 0;
  globalTerms.forEach((word) => {
    const docFreq = wordDocCount[word];
    if (docFreq > 0) {
      idf[index] = Math.log(documentCount / docFreq);
    } else {
      idf[index] = 0;
    }
    wrd2idx[word] = index;
    index ++;
  });

  // console.log("Here is the IDF: ", idf);
  // const allZeros = idf.every(value => value === 0);

  // if (allZeros) {
  //     console.log("All IDF values are zero");
  // } else {
  //     console.log("There are non-zero values in the IDF matrix");
  // }
  return idf;
}

function tfMatrix() {
  // var tf = new Array(documentCount);

  // for (var i = 0; i < tf.length; i++) {
  //     tf[i] = new Array(globalTerms.length);
  // }

  const tf = new Array(documentCount).fill(null).map(() => new Array(globalTerms.length).fill(0));

  // should be a (10, globalterms array)

  // console.log("here is the original array");
  // console.log(tf);
  for (let i = 0; i < documentCount; i++) {
    const wordCount = {};
    let maxFreq = 0;

    for (const word in termFrequency[idx_to_url[i]]) {
      if (word in wordCount) {
        wordCount[word] ++;
      } else {
        wordCount[word] = 1;
      }
      maxFreq = Math.max(maxFreq, wordCount[word]);
    }
    // console.log("LEFT");

    for (const word of globalTerms) {
      const freqWInDoc = wordCount[word] || 0;
      // console.log(freqWInDoc);
      // console.log("I AM HERER");


      if (freqWInDoc > 0) {
        tf[i][wrd2idx[word]] = 0.5 + 0.5 * (freqWInDoc / maxFreq);
      } else {
        tf[i][wrd2idx[word]] = 0;
      }
    }
  }

  // console.log("Here is the TF matrix:", tf);
  return tf;
}

let args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: ./query.js [query_strings...]');
  process.exit(1);
}
args = execSync(`echo "${args}" | ./../stem.js`, {encoding: 'utf-8'}).trim();


async function query(arg) {
  const startTime = performance.now();


  const data = await fs.promises.readFile('./urls.txt', 'utf-8');

  const urls = data.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

  await Promise.all(urls.map(async (url) => {
    const text = await extractTextFromUrl(url);
    if (text) {
      generate_grams(text, url);
    }
  }));

  // index into the tf-idx matrix and then find the top 5 most relevant results
  const idf_matrix = idfMatrix();
  const tf_matrix = tfMatrix();
  // tf_idf[url] = {term -> score}

  const tf_idf_matrix = new Array(documentCount).fill(null).map(() => new Array(globalTerms.length).fill(0));

  for (let i = 0; i < tf_matrix.length; i++) {
    for (let j = 0; j < tf_matrix[i].length; j++) {
      tf_idf_matrix[i][j] = tf_matrix[i][j] * idf_matrix[j];
    }
  }

  const word_to_index = wrd2idx[arg];


  const vals = [];
  for (let i = 0; i < documentCount; i++) {
    const score = tf_idf_matrix[i][word_to_index];
    if (score > 0) {
      vals.push({url: idx_to_url[i], score: score});
    }
  }
  vals.sort((a, b) => b.score - a.score);
  // console.log("ghuhghurhguhguh");
  const endTime = performance.now();
  const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
  console.log(`\nProcessing took ${timeTaken} seconds.`);

  if (vals.length > 0) {
    // console.log(vals.slice(0, 5).map(item => item.url));
    console.log(vals.slice(0, 5).map((item) => item.url).join('\n'));
  } else {
    // get the top 5 results
    // console.log(vals.len);
    console.log('no search results found');
  }
}


query(args);
