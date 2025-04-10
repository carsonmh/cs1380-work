const comm = require('../local/comm');
const log = require('../util/log');
const { getID } = require('./id');
const { serialize, deserialize } = require('./serialization');


global.toLocal = {}

function createRPC(func) {
  // console.log("CALLED!!!");
  function stub (...args) {
    const cb = args.pop()
    let remote = {node: '__NODE_INFO__', service: 'rpc', method: '__funcname__'}
    global.distribution.local.comm.send([...args], remote, cb)
  }

  global.toLocal[getID(func.toString())] = func

  const serializedStub = serialize(stub)
  const node = `{'ip': '${global.nodeConfig.ip}',port: ${global.nodeConfig.port}}`
  return deserialize(serializedStub.replace("'__NODE_INFO__'", node).replace("'__funcname__'", `'${getID(func.toString())}'`))
}

/*
  The toAsync function transforms a synchronous function that returns a value into an asynchronous one,
  which accepts a callback as its final argument and passes the value to the callback.
*/
function toAsync(func) {
  log(`Converting function to async: ${func.name}: ${func.toString().replace(/\n/g, '|')}`);

  // It's the caller's responsibility to provide a callback
  const asyncFunc = (...args) => {
    const callback = args.pop();
    try {
      const result = func(...args);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };

  /* Overwrite toString to return the original function's code.
   Otherwise, all functions passed through toAsync would have the same id. */
  asyncFunc.toString = () => func.toString();
  return asyncFunc;
}

module.exports = {
  createRPC: createRPC,
  toAsync: toAsync,
};
