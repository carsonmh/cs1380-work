const {serialize, deserialize} = require('../util/serialization');

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

  console.log(serialize({ip: "127.0.0.1", port: 8080, onStart: (s) => console.log('hi')}))
});

// test('serialize more complex object', () => {
//   const date = new Date('05-04-2023');
//   expect(serializeDeserialize(date)).toEqual(date);

//   const error = new Error('this is an error');
//   expect(serializeDeserialize(error)).toEqual(error);

//   const object = {value1: 'string', value2: undefined, value3: date};
//   expect(serializeDeserialize(object)).toEqual(object);

//   const f = (a) => {
//     return a + 1;
//   };
//   expect(serializeDeserialize(f).toString()).toEqual(f.toString()); // come back to this

//   const arr = [1, 2, 3, error, undefined];
//   expect(serializeDeserialize(arr)).toEqual(arr);
// });

