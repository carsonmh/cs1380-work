/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const id = distribution.util.id;

const ncdcGroup = {};
const avgwrdlGroup = {};
const cfreqGroup = {};


let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  
  const mapper = (key, value) => {
    const ip = value.split(' ')[0]
    return {[ip]: 1}
  };

  const reducer = (key, values) => {
    let res = {[key]: 0}
    for(const value of values) {
      res[key] += value
    }

    return res
  };

  const dataset = [
    {'ip_logs1': '1.1.1.1 request 1'},
    {'ip_logs2': '1.1.1.1 request 2'},
    {'ip_logs3': '1.1.1.2 request 3'},
  ];

  const expected = [
    {'1.1.1.2': 1},
    {'1.1.1.1': 2}
  ];

  const doMapReduce = (cb) => {
    distribution.ncdc.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer}, (e, v) => {
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;

  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.ncdc.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const mapper = (key, value) => {
    let res = []
    const words = value.split(/(\s+)/).filter((e) => e !== ' ');
    for(const word of words){ 
      const o = {[word]: key}
      res.push(o)
    }

    return res
  };

  const reducer = (key, values) => {
    let res = {}
    res[key] = new Set(values)
    res[key] = [...res[key]]
    return res
  };

  const dataset = [
    {'doc1': 'inverted indexes are very cool cool'},
    {'doc2': 'this is just another random wanted test function'},
    {'doc3': 'one more because I wanted 3'},
  ];

  

  const doMapReduce = (cb) => {
    distribution.avgwrdl.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer}, (e, v) => {
      try {
        // expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;

  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.avgwrdl.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});


test('performance characterization', (done) => {
  // Fill out this test case...
  const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== ' ');
    const out = {};
    out[words[1]] = parseInt(words[3]);
    return [out];
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => Math.max(a, b), -Infinity);
    return out;
  };

  const dataset = [
    // {'000': '006701199099999 1950 0515070049999999N9 +0000 1+9999'},
  ];

  function getRandomValueFromArray(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }

  let years = ['1950', '1951', '1952', '1953', '1954', '1955', '1956', '1957', '1958']

  for(let i = 0; i < 10; i ++) {
    dataset.push(
      {[i.toString()]: `006701199099999 ${getRandomValueFromArray(years)} 0515070049999999N9 +0001 1+9999`},
    )
  }

  const doMapReduce = (cb) => {
    const startTime = performance.now()
    distribution.cfreq.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer}, (e, v) => {
      const endTime = performance.now()
      const diff = endTime - startTime
      console.log('total time taken (s): ', diff/1000)
      try {
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;
  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.cfreq.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  done(new Error('Not implemented'));
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  done(new Error('Not implemented'));
});



// Helper function to extract keys from dataset (in case the get(null) funnctionality has not been implemented)
function getDatasetKeys(dataset) {
  return dataset.map((o) => Object.keys(o)[0]);
}

beforeAll((done) => {
  ncdcGroup[id.getSID(n1)] = n1;
  ncdcGroup[id.getSID(n2)] = n2;
  ncdcGroup[id.getSID(n3)] = n3;

  avgwrdlGroup[id.getSID(n1)] = n1;
  avgwrdlGroup[id.getSID(n2)] = n2;
  avgwrdlGroup[id.getSID(n3)] = n3;

  cfreqGroup[id.getSID(n1)] = n1;
  cfreqGroup[id.getSID(n2)] = n2;
  cfreqGroup[id.getSID(n3)] = n3;


  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          cb();
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const ncdcConfig = {gid: 'ncdc'};
    startNodes(() => {
      distribution.local.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
        distribution.ncdc.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
          const avgwrdlConfig = {gid: 'avgwrdl'};
          distribution.local.groups.put(avgwrdlConfig, avgwrdlGroup, (e, v) => {
            distribution.avgwrdl.groups.put(avgwrdlConfig, avgwrdlGroup, (e, v) => {
              const cfreqConfig = {gid: 'cfreq'};
              distribution.local.groups.put(cfreqConfig, cfreqGroup, (e, v) => {
                distribution.cfreq.groups.put(cfreqConfig, cfreqGroup, (e, v) => {
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
});

afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      });
    });
  });
});
