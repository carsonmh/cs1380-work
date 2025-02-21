/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require("../../config");
const local = distribution.local;
const id = distribution.util.id;
const config = distribution.node.config;


test('(1 pts) student test', (done) => {
  // Fill out this test case...
  distribution.local.status.get('nid', (e, v) => {
    try {
      expect(v).toBe(id.getNID(config));
      done()
    }catch(e) {
      done(e)
    }
  });
}); 


test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const node = distribution.node.config;

  const remote = {node: node, service: 'status', method: 'bad_method'};
  const message = ['nid'];

  distribution.local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeTruthy();
      done();
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
  let node = distribution.node.config;

  const remote = {node: node, service: 'status', method: 'get'};
  const message = []; // <- no args when we expect args

  distribution.local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeTruthy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};
  const message = [
    'counts',
  ];

  local.comm.send(message, remote, (e, v) => {
    local.comm.send(message, remote, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(1);
        done();
      } catch (error) {
        done(error);
      }
    });
    })
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};
  const message = [
    'heapUsed',
  ];

  local.comm.send(message, remote, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBeGreaterThanOrEqual(30000000);
        done();
      } catch (error) {
        done(error);
      }
    })
});


// test('performance characterizaiton for comm', (done) => {
//   const node = distribution.node.config;
//   const remote = {node: node, service: 'status', method: 'get'};
//   const message = [
//     'heapUsed',
//   ];

//   let totalTime = 0
//   for(let i = 0; i < 1000; i++ ){
//     const startTime = performance.now()
//     local.comm.send(message, remote, (e, v) => {
//         try {
//           expect(e).toBeFalsy();
//         } catch (error) {
//         }
//       })
//     const endTime = performance.now()
//     const diff = endTime - startTime
//     totalTime += diff
//   }
//   console.log(totalTime / 1000)
//   done()
// })

let localServer = null;

beforeAll((done) => {
  distribution.node.start((server) => {
    localServer = server;
    done();
  });
});

afterAll((done) => {
  localServer.close();
  done();
});
