/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/
const { id } = require("../../distribution/util/util");

const distribution = require('../../config.js');

test('(1 pts) student test', (done) => {
  const gotchaService = {};

  gotchaService.gotcha = () => {
    return 'gotcha!';
  };

  distribution.mygroup.routes.put(gotchaService,
      'gotcha', (e, v) => {
        const n1 = {ip: '127.0.0.1', port: 8000};
        const r1 = {node: n1, service: 'routes', method: 'get'};

        distribution.mygroup.comm.send(['test'], r1, (e, v) => {
          try {
            expect(e).toBeTruthy();
            done()
            // expect(v.gotcha()).toBe('gotcha!');
          } catch (error) {
            done(error);
            return;
          }
        });
      });
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const g = {
    'al57j': {ip: '127.0.0.1', port: 9092},
    'q5mn9': {ip: '127.0.0.1', port: 9093},
  };

  distribution.group4.groups.put('atlas', g, (e, v) => {
    distribution.group4.groups.rem('atlas', 'q5mn9', (e, v) => {
      const node1 = {ip: '127.0.0.1', port: 9093}
      const testId = id.getSID(node1)
      const expectedGroup = {
        'al57j': {ip: '127.0.0.1', port: 9092},
        [testId]: node1,
      };

      distribution.group4.groups.add('atlas', {ip: '127.0.0.1', port: 9093}, (e, v) => {
        distribution.group4.groups.get('atlas', (e, v) => {
          try {
            expect(e).toEqual({});
            expect(v[id.getSID(n1)]).toEqual(expectedGroup);
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const sids = Object.values(mygroupGroup).map((node) => id.getSID(node));

  distribution.mygroup.status.get('sid', (e, v) => {
    try {
      console.log(v)
      expect(e).toEqual({});
      expect(Object.values(v).length).toBe(sids.length);
      expect(Object.values(v)).toEqual(expect.arrayContaining(sids));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  // const counts = Object.values(mygroupGroup).map((node) => id.getSID(node));

  distribution.local.comm.send(['sid'],
  {node: n1, service: 'status', method: 'get'}, () => {
    distribution.mygroup.status.get('sid', () => {
      distribution.mygroup.status.get('counts', (e, v) => {
        try {
          expect(e).toEqual({});
          expect(v['total']).toEqual(4)
          done();
        } catch (error) {
          done(error);
        }
      });
    })
  })
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  distribution.mygroup.status.get('heapTotal', (e, v) => {
    try {
      expect(e).toEqual({});
      expect(v['total']).toBeGreaterThan(1)
      done();
    } catch (error) {
      done(error);
    }
  });
});

const mygroupGroup = {};
// This group is used for {adding,removing} {groups,nodes}
const group4Group = {};

let localServer = null;

const n1 = {ip: '127.0.0.1', port: 8000};
const n2 = {ip: '127.0.0.1', port: 8001};
const n3 = {ip: '127.0.0.1', port: 8002};
const n4 = {ip: '127.0.0.1', port: 8003};
const n5 = {ip: '127.0.0.1', port: 8004};
const n6 = {ip: '127.0.0.1', port: 8005};


beforeAll((done) => {
  // First, stop the nodes if they are running
  const remote = {service: 'status', method: 'stop'};

  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n5;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n6;
            distribution.local.comm.send([], remote, (e, v) => {
            });
          });
        });
      });
    });
  });

  mygroupGroup[id.getSID(n1)] = n1;
  mygroupGroup[id.getSID(n2)] = n2;
  mygroupGroup[id.getSID(n3)] = n3;

  group4Group[id.getSID(n1)] = n1;
  group4Group[id.getSID(n2)] = n2;
  group4Group[id.getSID(n4)] = n4;

  // Now, start the base listening node
  distribution.node.start((server) => {
    localServer = server;

    const groupInstantiation = (e, v) => {
      const mygroupConfig = {gid: 'mygroup'};
      const group4Config = {gid: 'group4'};

      // Create some groups
      distribution.local.groups
          .put(mygroupConfig, mygroupGroup, (e, v) => {
            distribution.local.groups
                .put(group4Config, group4Group, (e, v) => {
                  done();
                });
          });
    };

    // Start the nodes
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          distribution.local.status.spawn(n4, (e, v) => {
            distribution.local.status.spawn(n5, (e, v) => {
              distribution.local.status.spawn(n6, groupInstantiation);
            });
          });
        });
      });
    });
  });
});

afterAll((done) => {
  distribution.mygroup.status.stop((e, v) => {
    const remote = {service: 'status', method: 'stop'};
    remote.node = n1;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n2;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n3;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n4;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n5;
            distribution.local.comm.send([], remote, (e, v) => {
              remote.node = n6;
              distribution.local.comm.send([], remote, (e, v) => {
                localServer.close();
                done();
              });
            });
          });
        });
      });
    });
  });
});
