const comm = require('../local/comm');
const log = require('../util/log');
const { getID } = require('./id');
const { serialize, deserialize } = require('./serialization');


let toLocal = {}

function createRPC(func) {
  function stub (...args) {
    console.log("stub is getting called")
    // const cb = args.pop() <- needed?
    // const serializedArgs = serialize(args) <- happens on comm.send
    let remote = {node: '__NODE_INFO__', service: 'rpc', method: func.name}
    return new Promise((resolve, reject) => {
      
        comm.send([...args], remote, (e, v) => {
        if(e) {
          return reject(e)
        }
        const serializedRes = v
        resolve(deserialize(serializedRes))
      })

    })
  }

  toLocal[getID(serialize(func.name))] = func

  const serializedStub = serialize(stub)
  const node = JSON.stringify({
    ip: global.nodeConfig.ip, 
    port: global.nodeConfig.port
  })

  return serializedStub.replace('"__NODE_INFO__"', node)
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
