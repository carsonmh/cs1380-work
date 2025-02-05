const distribution = require('../../config.js');
const {serialize, deserialize} = distribution.util

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

test('serialize more complex object', () => {
  const date = new Date('05-04-2023');
  expect(serializeDeserialize(date)).toEqual(date);
});

test('', () => {
    const error = new Error('this is an error');
  expect(serializeDeserialize(error)).toEqual(error);
})

test('', () => {
    const date = new Date('05-04-2023');
    const object = {value1: 'string', value2: undefined, value3: date};
  expect(serializeDeserialize(object)).toEqual(object);

})

test('', () => {
    const f = (a) => {
        return a + 1;
      };
      expect(serializeDeserialize(f).toString()).toEqual(f.toString()); // come back to this
})

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