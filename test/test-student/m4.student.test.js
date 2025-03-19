/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const id = require('../../distribution/util/id.js')

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const user = {first: 'Gus', last: 'Fring'};

  distribution.local.mem.put(user, null, (e, v) => {
    distribution.local.mem.del(id.getID(user), (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(user);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const user = {first: 'Gus', last: 'Fring'};

  distribution.local.mem.get(id.getID(user), (e, v) => {
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
  const user = {first: 'Gus', last: 'Fring'};

  distribution.local.mem.put(user, null, (e, v) => {
    distribution.local.mem.put(user, null, (e, v) => {
      try {
        expect(e).toBeFalsy();
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const user = {first: 'Gus', last: 'Fring'};

  distribution.local.mem.get(id.getID(user), (e, v) => {
    distribution.local.mem.put( user, null, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(user);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
  const user = {first: 'Gus', last: 'Fring'};

  distribution.local.mem.del(id.getID(user), (e, v) => {
    distribution.local.mem.get(id.getID(user), (e, v) => {
      try {
        expect(e).toBeTruthy();
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
