/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const {serialize, deserialize} = distribution.util

test('(1 pts) student test', () => {
  // Fill out this test case...
  const string = 'This is a string';
  expect(serializeDeserialize(string)).toBe(string);

  const number = 2;
  expect(serializeDeserialize(number)).toBe(number);

  const bool = true;
  expect(serializeDeserialize(bool)).toBe(bool);

  const nullVal = null;
  expect(serializeDeserialize(nullVal)).toBe(nullVal);

  const undefinedVal = undefined;
  expect(serializeDeserialize(undefinedVal)).toBe(undefinedVal);
});


test('(1 pts) student test', () => {
  // Fill out this test case...
  const date = new Date('05-04-2023');
  expect(serializeDeserialize(date)).toEqual(date);
});


test('(1 pts) student test', () => {
  // Fill out this test case...
  const error = new Error('this is an error');
  expect(serializeDeserialize(error)).toEqual(error);
});

test('(1 pts) student test', () => {
  // Fill out this test case...
  const date = new Date('05-04-2023');
  const object = {value1: 'string', value2: undefined, value3: date, value4: {val: {val2: {val3: {val4: 3}}}}};
expect(serializeDeserialize(object)).toEqual(object);
});

test('(1 pts) student test', () => {
  // Fill out this test case...
  const f = (a) => {
    return a + 1;
  };
  expect(serializeDeserialize(f).toString()).toEqual(f.toString()); // come back to this
});

function serializeDeserialize(value) {
  return deserialize(serialize(value));
}

test('serialize basic types', () => {
  const string = 'This is a string';
  expect(serializeDeserialize(string)).toBe(string);

  const number = 2;
  expect(serializeDeserialize(number)).toBe(number);

  const bool = true;
  expect(serializeDeserialize(bool)).toBe(bool);

  const nullVal = null;
  expect(serializeDeserialize(nullVal)).toBe(nullVal);

  const undefinedVal = undefined;
  expect(serializeDeserialize(undefinedVal)).toBe(undefinedVal);
});


test('', () => {
    const error = new Error('this is an error');
    const arr = [1, 2, 3, error, undefined];
    expect(serializeDeserialize(arr)).toEqual(arr);
})

test('function latency test for complex object', () => {
    const obj = {a: 3, b: "string", c: new Date("04-04-2024")}

    let totalTime = 0
    for(let i = 0; i < 10; i++ ){
        const startTime = performance.now()
        serialize(obj)
        const endTime = performance.now()
        const difference = endTime - startTime
        totalTime += difference
    }

    console.log("average serialization time: " + totalTime / 10)

    const str = '{"type":"object","value":{"a":"{\\"type\\":\\"string\\",\\"value\\":\\"jcarb\\"}","b":"{\\"type\\":\\"number\\",\\"value\\":\\"1\\"}","c":"{\\"type\\":\\"function\\",\\"value\\":\\"(a, b) => a + b\\"}"}}'
    totalTime = 0
    for(let i = 0; i < 10; i++ ){
        const startTime = performance.now()
        deserialize(str)
        const endTime = performance.now()
        const difference = endTime - startTime
        totalTime += difference
    }

    console.log("average deserialization time: " + totalTime / 10)
})

test('function latency test for function', () => {
  const f = (a, b) => {return a + b}

  let totalTime = 0
  for(let i = 0; i < 10; i++ ){
      const startTime = performance.now()
      serialize(f)
      const endTime = performance.now()
      const difference = endTime - startTime
      totalTime += difference
  }

  console.log("average serialization time: " + totalTime / 10)

  const str = '{"type":"function","value":"(a) => {return a+1}"}'
  totalTime = 0
  for(let i = 0; i < 10; i++ ){
      const startTime = performance.now()
      deserialize(str)
      const endTime = performance.now()
      const difference = endTime - startTime
      totalTime += difference
  }

  console.log("average deserialization time: " + totalTime / 10)
})


test('function latency test for basic', () => {
  const basic = 2

  let totalTime = 0
  for(let i = 0; i < 100; i++ ){
      const startTime = performance.now()
      serialize(basic)
      const endTime = performance.now()
      const difference = endTime - startTime
      totalTime += difference
  }

  console.log("average serialization time: " + totalTime / 100)

  const str = '{"type":"number","value":"2"}'
  totalTime = 0
  for(let i = 0; i < 100; i++ ){
      const startTime = performance.now()
      deserialize(str)
      const endTime = performance.now()
      const difference = endTime - startTime
      totalTime += difference
  }

  console.log("average deserialization time: " + totalTime / 100)
})