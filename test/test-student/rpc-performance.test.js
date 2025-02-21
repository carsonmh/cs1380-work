// const distribution = require('../../config.js');
// const { createRPC } = require('../../distribution/util/wire.js');

// test('rpc performance characterization', (done) => {
//     let n = 0;
//     const addOne = () => {
//       return ++n;
//     };
  
//     const node = {ip: '127.0.0.1', port: 9009};
  
//     const addOneRPC = distribution.util.wire.createRPC(
//       distribution.util.wire.toAsync(addOne));
  
//     const rpcService = {
//       addOne: addOneRPC,
//     };
  
//     distribution.node.start((server) => {
//       function cleanup(callback) {
//         server.close();
//         distribution.local.comm.send([],
//             {node: node, service: 'status', method: 'stop'},
//             callback);
//       }
  
//       let totalTime = 0
//       distribution.local.status.spawn(node, (e, v) => {
//         distribution.local.comm.send([rpcService, 'addOneService'],
//             {node: node, service: 'routes', method: 'put'}, (e, v) => {
//               for(let i = 0; i < 1000; i++) {
//                 const startTime = performance.now()
//                 distribution.local.comm.send([], {node: node, service: 'addOneService', method: 'addOne'}, (e, v) => {});
//                 const endTime = performance.now()
//                 const diff = endTime - startTime
//                 // console.log(diff)
//                 totalTime += diff
//                 console.log(totalTime / 1000)
//               }
//             });
//           cleanup(done)
//       });
//       console.log(totalTime)
//   });
//   });