const fs = require('fs');
const distribution = require('../../config.js');
// const id = distribution.util.id;

const filePath = 'indexer_output.txt';

const fileContents = fs.readFileSync(filePath, 'utf8');

const indexData = distribution.util.deserialize(fileContents);

const urlListPath = 'url_list.txt';

const urlListContents = fs.readFileSync(urlListPath, 'utf8');

const urlList = distribution.util.deserialize(urlListContents);

function buildIndex(data) {
    
    const index = {};
    
    data.forEach(entry => {
        
        for (let term in entry) {

            if (!index[term]) {

                index[term] = {};
            }

            index[term] = { ...index[term], ...entry[term] };

        }
    });

    return index;
}


function queryIndex(query) {

    const queryTerms = query.split(' '); 

    const results = {}; 
    
    queryTerms.forEach(term => {

        if (index[term]) {
            
            for (let urlKey in index[term]) {

                if (!results[urlKey]) {

                    results[urlKey] = 0; 

                }
                
                results[urlKey] += index[term][urlKey]; 
            }
        }
    });

    
    const sortedUrls = Object.entries(results)
        .sort((a, b) => b[1] - a[1]) 
        .map(entry => entry[0]); 

    
    const actualUrls = sortedUrls.map(urlKey => urlList[urlKey]);

    return actualUrls;
}


const index = buildIndex(indexData);
const query = process.argv.slice(2).join(' '); 

if (!query) {
    console.log('Please provide a query as an argument.');
    process.exit(1);
}

const relevantUrls = queryIndex(query);

console.log("Relevant URLs for query:", query);
console.log(relevantUrls); 
