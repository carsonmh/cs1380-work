
function serialize(object) {
  // return require('@brown-ds/distribution').util.serialize(object);
  if (typeof object == 'number') {
    return `{"type":"number","value":"${object.toString()}"}`;
  }
  if (typeof object == 'string') {
    return `{"type":"string","value":${JSON.stringify(object)}}`;
  }
  if (typeof object == 'boolean') {
    return `{"type":"boolean","value":"${object.toString()}"}`;
  }
  if (typeof object === 'undefined') {
    return '{"type":"undefined","value":"undefined"}';
  }
  if (object == null) {
    return '{"type":"null","value":"null"}';
  }
  if (typeof object == 'function') {
    const serializedFunction = object.toString();
    return JSON.stringify({type: 'function', value: serializedFunction});
  }
  if (object instanceof Array) {
    let serial = '[';
    for (const obj of object) {
      if (serial.length != 1) {
        serial += ', ';
      }
      serial += JSON.stringify(serialize(obj));
    }
    serial += ']';
    // TODO: change this
    return JSON.stringify({type: 'array', value: serial});
  }
  if (object instanceof Error) {
    return JSON.stringify({type:"error",value:object});
  }
  if (object instanceof Date) {
    return `{"type":"date","value":"${object.toISOString()}"}`;
  }

  const keys = Object.keys(object);
  const newObj = {};
  for (const key of keys) {
    newObj[key] = serialize(object[key]);
  }

  return `{"type":"object","value":${JSON.stringify(newObj)}}`;
}


function deserialize(string) {
  // return require('@brown-ds/distribution').util.deserialize(string);
  // console.log(string);
  const obj = JSON.parse(string);
  // edge case we are dealing with an html doctype
  switch (obj.type) {
    case 'number':
      return parseFloat(obj.value);
    case 'string':
      return obj.value;
    case 'boolean':
      return obj.value == 'true';
    case 'null':
      return null;
    case 'undefined':
      return undefined;
    case 'function':
      const func = eval(`(${obj.value})`);
      return func;
    case 'array':
      const retVal = [];
      for (const value of JSON.parse(obj.value)) {
        retVal.push(deserialize(value));
      }
      return retVal;
    case 'error':
      return new Error(obj.value);
    case 'date':
      return new Date(obj.value);
    case 'object':
      const retObj = {};
      for (const [key, value] of Object.entries(obj.value)) {
        retObj[key] = deserialize(value);
      }
      return retObj;
    default:
      console.log('there should be some case hit');
  }
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
