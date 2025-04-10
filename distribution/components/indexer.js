const distribution = require('../../config.js');
const id = distribution.util.id;
const fs = require('fs');
const serialization = require('../util/serialization');

const tfidfGroup = {};

const crawlGroup = {};

let localServer = null;

let number_of_documents = 0;

const n1 = { ip: '127.0.0.1', port: 7110 };
const n2 = { ip: '127.0.0.1', port: 7111 };
const n3 = { ip: '127.0.0.1', port: 7112 };

const tfidfConfig = { gid: 'tfidf' };

function startNodes(callback) {
    distribution.local.status.spawn(n1, (e, v) => {
        distribution.local.status.spawn(n2, (e, v) => {
            distribution.local.status.spawn(n3, (e, v) => {
                callback();
            });
        });
    });
}

function end() {
    const remote = {service: 'status', method: 'stop'};
    remote.node = n1;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n2;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n3;
        distribution.local.comm.send([], remote, (e, v) => {
                localServer.close();
            });
        });
    });
}

// use this function to check the number of urls (number of documents or not)
function isSHA256(filename) {
    const sha256Regex = /^[a-f0-9]{64}$/i;
    return sha256Regex.test(filename);
}

// calculates number of documents
function calculate_document_number() {
    // this should be crawler.get 
    distribution.tfidf.store.get(null, (e, v) => {
        // let node_num_doc = 0;
            v.forEach(key_name => {
                if (isSHA256(key_name)) {
                    number_of_documents ++;
                }
            });
        console.log("here is number_of_documents");
        console.log(number_of_documents);
        do_tf_idf(v);
    });
}


function do_tf_idf(keys){
    const mapper = (key, value) => {
        const { JSDOM } = require('jsdom');
        // console.log(value);
        const firstKey = Object.keys(value)[0];
        // first key of value
        const dom = new JSDOM(value[firstKey]);
        const textContent = dom.window.document.body.textContent;
        console.log("here is text content");
        console.log(textContent);
        const cleanText = textContent.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ').toLowerCase();
        const words = cleanText.split(' ').filter((e) => e.length > 0);
        console.log("here are words");
        console.log(words);
        const out = {};
        let totalCount = words.length;
        words.forEach((word) => {
          if(out[word]) {
            out[word].itemCount += 1
          }else {
            out[word] = {documentId: firstKey, wordCount: totalCount, itemCount: 1, document: value}
          }
        });
    
        let res = []
        for(const [key, value] of Object.entries(out)) {
          res.push({[key]: value})
        }
    
        return res;
    };
    
    // Reduce function: calculate TF-IDF for each word
    let reducer = (key, values) => {
        const fs = require('fs');
        const path = require("path");
        // console.log("IN REDUCER - here is key");
        // console.log(key);
        // console.log("IN REDUCER - here is value");
        // console.log(values);
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
          
            const dirPath = `store/${global.distribution.node.config.port}/tfidf`;

            fs.mkdirSync(dirPath, { recursive: true });
            
            const filePath = path.join(dirPath, `${word}.txt`);

            fs.writeFileSync(filePath, serializedData, 'utf8');
        }
        return res
    };

    const serializedReducer = global.distribution.util.serialize(reducer);

    const updatedSerializedReducer = serializedReducer.replace('num_docs = 0;', `num_docs = ${number_of_documents};`);

    reducer = global.distribution.util.deserialize(updatedSerializedReducer);

    distribution.tfidf.mr.exec({keys: keys, map: mapper, reduce: reducer}, (e, v) => {
        try {
        //   console.log(v === expected);
            // serialize v to a file called indexer_output.txt
          console.log("here is v");
          console.log(v);
        //   const serializedData = global.distribution.util.serialize(v);
        //   fs.writeFileSync('indexer_output.txt', serializedData, 'utf8');
          // stop the nodes 
          end();
          // now write v to a file 
            //   done();
        } catch (e) {
            console.log("error");
            console.log(e);
            //   done(e);
        }
    });
}

// this is for testing purposes only (this is not acually part of the indexer just setting up data)
function put_things_in_local_storage() {
    console.log("put things in local storage");
    const obj1 = { "hello.com": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Home Page</title>\n    <style>\n        body {\n            font-family: Arial, sans-serif;\n            margin: 0;\n            padding: 0;\n            background-color: #f4f4f4;\n            color: #333;\n            text-align: center;\n        }\n\n        .container {\n            max-width: 800px;\n            margin: auto;\n            padding: 20px;\n        }\n\n        h1 {\n            color: #4CAF50;\n        }\n\n        a {\n            color: #5D4037;\n            text-decoration: none;\n            font-size: 1.2em;\n        }\n\n        a:hover {\n            color: #FF5722;\n        }\n\n        .footer {\n            margin-top: 30px;\n            padding: 10px;\n            background-color: #3F51B5;\n            color: white;\n            text-align: center;\n        }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <h1>Welcome to CS1380 simple links</h1>\n        <p>Check out my <a href=\"level_1a/index.html\">Some stuff</a>.</p>\n        <p>Check out my <a href=\"level_1b/index.html\">Some more stuff</a>.</p>\n        <p>Check out a few <a href=\"level_1c/index.html\">Some more more stuff</a>.</p>\n    </div>\n    <div class=\"footer\">\n        <p>© 2023 CS1380. All rights reserved.</p>\n    </div>\n</body>\n</html>\n"};
    const obj2 = { "bye.com": `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>About Us</title>
        <style>
            body {
                font-family: 'Helvetica Neue', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #eaeaea;
                color: #2c3e50;
                text-align: center;
            }
    
            .container {
                max-width: 900px;
                margin: auto;
                padding: 30px;
            }
    
            h1 {
                color: #3498db;
            }
    
            a {
                color: #e74c3c;
                text-decoration: none;
                font-size: 1.1em;
            }
    
            a:hover {
                color: #c0392b;
            }
    
            .footer {
                margin-top: 40px;
                padding: 15px;
                background-color: #34495e;
                color: white;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>About Our Company</h1>
            <p>Learn more about our <a href="services.html">Services</a>.</p>
            <p>Discover our <a href="team.html">Team</a> and their backgrounds.</p>
            <p>Contact us for <a href="contact.html">Inquiries</a> and support.</p>
        </div>
        <div class="footer">
            <p>© 2023 Our Company. All rights reserved.</p>
        </div>
    </body>
    </html>`};
    
    const obj3 = { "iamok.com":
        `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portfolio</title>
        <style>
            body {
                font-family: 'Roboto', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f7f7f7;
                color: #2c3e50;
                text-align: center;
            }
    
            .container {
                max-width: 1000px;
                margin: auto;
                padding: 40px;
            }
    
            h1 {
                color: #8e44ad;
            }
    
            a {
                color: #2980b9;
                text-decoration: none;
                font-size: 1.2em;
            }
    
            a:hover {
                color: #16a085;
            }
    
            .footer {
                margin-top: 50px;
                padding: 20px;
                background-color: #34495e;
                color: white;
                text-align: center;
            }
    
            .projects {
                margin-top: 30px;
            }
    
            .project {
                margin: 20px;
            }
    
            .project img {
                width: 100%;
                height: auto;
                border-radius: 8px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to My Portfolio</h1>
            <p>Explore some of my recent projects:</p>
            <div class="projects">
                <div class="project">
                    <h3><a href="project1.html">Project One: Web Design</a></h3>
                    <p>A beautiful website design built using HTML, CSS, and JavaScript.</p>
                    <img src="project1-image.jpg" alt="Project One">
                </div>
                <div class="project">
                    <h3><a href="project2.html">Project Two: E-commerce</a></h3>
                    <p>A full-fledged e-commerce platform built with React and Node.js.</p>
                    <img src="project2-image.jpg" alt="Project Two">
                </div>
                <div class="project">
                    <h3><a href="project3.html">Project Three: Data Visualization</a></h3>
                    <p>An interactive dashboard to visualize large data sets using D3.js.</p>
                    <img src="project3-image.jpg" alt="Project Three">
                </div>
            </div>
        </div>
        <div class="footer">
            <p>© 2023 Portfolio. All rights reserved.</p>
        </div>
    </body>
    </html>`};
    // const obj1 = "machine learning is amazing";
    // const obj2 = "deep learning powers amazing systems";
    // const obj3 = "machine learning and deep learning are related";
    const first_url = id.getID("hello.com");
    const second_url = id.getID("bye.com");
    const third_url = id.getID("iamok.com");
    // this should be crawler -> actually it does not matter all the nodes should be part of the same group anyway
    // because that is how map reduce works
    distribution.tfidf.store.put(obj1, first_url, (e, v) => {
        distribution.tfidf.store.put(obj2, second_url, (e, v) => {
          distribution.tfidf.store.put(obj3, third_url, (e, v) => {
            calculate_document_number();
          });
        });
    });
}

function run() {
    console.log("I am in run");

    distribution.node.start((server) => {
        localServer = server;

        tfidfGroup[id.getSID(n1)] = n1;
        tfidfGroup[id.getSID(n2)] = n2;
        tfidfGroup[id.getSID(n3)] = n3;
        // the crawl group was used just for testing purposes its not actually used 
        crawlGroup[id.getSID(n1)] = n1;
        crawlGroup[id.getSID(n2)] = n2;
        crawlGroup[id.getSID(n3)] = n3;


        startNodes(() => {
            // this is just for testing purposes only 
            distribution.local.groups.put(tfidfConfig, tfidfGroup, (e, v) => {
                distribution.tfidf.groups.put(tfidfConfig, tfidfGroup, (e, v) => {
                    const crawlConfig = {gid: 'crawl'};
                    distribution.local.groups.put(crawlConfig, crawlGroup, (e, v) => {
                        distribution.crawl.groups.put(crawlConfig, crawlGroup, (e, v) => {
                            console.log("before put things in local storage");
                            put_things_in_local_storage();
                        });
                    });
                });
            });
        });
    });
}


run();
