const {execSync} = require('child_process');
const {readFileSync, writeFileSync} = require('fs');


test('process test', () => {
  const args = `Spanning an impressive distance of over 9,000 kilometers (about 5,600 miles), the Trans-Siberian Railway is the longest railway line in the world. It connects Moscow in the west of Russia to Vladivostok on the country's eastern seaboard. The journey on this railway offers a unique travel experience, showcasing Russia's vast and varied landscape, which includes the Ural Mountains, the plains of Siberia, and the shores of Lake Baikal, the deepest and oldest freshwater lake in the world. Commenced in 1891 and completed in 1916, this railway line is not just a vital transportation route; it's also a remarkable feat of engineering, crossing eight time zones and providing an unparalleled way to experience the sheer scale and diversity of Russia's geography and cultures. Travelers can opt for different routes, such as the Trans-Mongolian line, which diverts through Mongolia and China, offering even more diverse landscapes and cultural experiences. A journey on the Trans-Siberian Railway is often considered a "once in a lifetime" adventure for avid travelers, combining historical significance, engineering marvels, and a unique way to immerse in the vastness of the Eurasian continent.`;
  const res = execSync(`echo "${args}" | ./c/process.sh`, {encoding: 'utf-8'});
  const expected = `spanning
impressive
distance
kilometers
miles
trans
siberian
railway
railway
connects
moscow
west
russia
vladivostok
country
eastern
seaboard
journey
railway
offers
unique
travel
experience
showcasing
russia
vast
varied
landscape
includes
ural
mountains
plains
siberia
shores
lake
baikal
deepest
freshwater
lake
commenced
completed
railway
vital
transportation
route
remarkable
feat
engineering
crossing
time
zones
providing
unparalleled
experience
sheer
scale
diversity
russia
geography
cultures
travelers
opt
routes
trans
mongolian
diverts
mongolia
china
offering
diverse
landscapes
cultural
experiences
journey
trans
siberian
railway
considered
lifetime
adventure
avid
travelers
combining
historical
significance
engineering
marvels
unique
immerse
vastness
eurasian
continent
`;
  expect(res).toBe(expected);
});

test('stem test', () => {
  const res = execSync('node ./c/stem.js', {encoding: 'utf-8', input: 'finding\nfighting\nsimple\nstm'});
  const expected = `find
fight
simpl
stm
`;
  expect(res).toBe(expected);
});

test('getText test', () => {
  const args = `<!DOCTYPE html>
  <html lang="en">
  <head>
      This shouldn't be included
  </head>
  <body>
      This should be included
  </body>
  </html>`;

  const res = execSync('node ./c/getText.js', {encoding: 'utf-8', input: args});
  expect(res).toBe('This should be included\n');
});

test('getUrls test', () => {
  const args = 'https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/index.html';

  // const res = execSync(`node ./c/getURLs.js ${args}`, {encoding: 'utf-8'})
  // console.log(res)
  // expect(res).toBe("url.com\n")

  const res = execSync(`node c/getURLs.js ${args}`, {
    input: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Home Page</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f4f4f4;
                  color: #333;
                  text-align: center;
              }
      
              .container {
                  max-width: 800px;
                  margin: auto;
                  padding: 20px;
              }
      
              h1 {
                  color: #4CAF50;
              }
      
              a {
                  color: #5D4037;
                  text-decoration: none;
                  font-size: 1.2em;
              }
      
              a:hover {
                  color: #FF5722;
              }
      
              .footer {
                  margin-top: 30px;
                  padding: 10px;
                  background-color: #3F51B5;
                  color: white;
                  text-align: center;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Welcome to CS1380 simple links</h1>
              <p>Check out <a href="level_2a/index.html">Some stuff</a>.</p>
              <p>Check out <a href="level_2b/index.html">Some more stuff</a>.</p>
          </div>
          <div class="footer">
              <p>© 2023 CS1380. All rights reserved.</p>
          </div>
      </body>
      </html>
      `,
    encoding: 'utf-8',
  })
      .trim()
      .split('\n')
      .sort()
      .join('\n');

  expect(res).toBe(`https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/level_2a/index.html
https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/level_2b/index.html`);
});

test('test merge', () => {
  writeFileSync('d/global-index.txt', '');
  for (let i = 1; i <= 2; i++) {
    const inputFile = `./t/d/m${i}.txt`;
    const input = readFileSync(inputFile, 'utf-8');

    const output = execSync('node c/merge.js d/global-index.txt', {
      input,
      encoding: 'utf-8',
    });

    writeFileSync('d/global-index.txt', output);
  }

  const globalIndex = readFileSync('d/global-index.txt', 'utf-8');

  const expectedOutput = readFileSync('./t/d/student-data-3.txt', 'utf-8');

  expect(globalIndex).toBe(expectedOutput);
});

test('test query', () => {
  const source = readFileSync('./t/d/d7.txt', 'utf-8');
  writeFileSync('./d/global-index.txt', source);

  const output = execSync('node query.js check', {input: readFileSync('./d/global-index.txt', 'utf-8'), encoding: 'utf-8'});
  expect(output).toBe(`check | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 2
check stuff | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 2
check stuff level | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 2
level check | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 1
level check stuff | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 1
link check | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 1
link check stuff | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 1
simpl link check | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 1
stuff level check | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 1
`);
});


test('test query', () => {
  const source = readFileSync('./t/d/d7.txt', 'utf-8');
  writeFileSync('./d/global-index.txt', source);

  const output = execSync('node query.js check stuff', {input: readFileSync('./d/global-index.txt', 'utf-8'), encoding: 'utf-8'});
  expect(output).toBe(`check stuff | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 2
check stuff level | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 2
level check stuff | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 1
link check stuff | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 1
`);
});

test('test query', () => {
  const source = readFileSync('./t/d/d7.txt', 'utf-8');
  writeFileSync('./d/global-index.txt', source);

  const output = execSync('node query.js check stuff level', {input: readFileSync('./d/global-index.txt', 'utf-8'), encoding: 'utf-8'});
  expect(output).toBe(`check stuff level | https://cs.brown.edu/courses/csci1380/sandbox/1/level_1a/index.html 2
`);
});
