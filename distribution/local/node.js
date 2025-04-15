const http = require('http');
const url = require('url');
const log = require('../util/log');
const {deserialize, serialize} = require('../util/serialization');
const routes = require('./routes');
const { status } = require('./local');
/*
    The start function will be called to start your node.
    It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/


const start = function(callback) {
  const server = http.createServer((req, res) => {
    /* Your server will be listening for PUT requests. */

    // Write some code...
    if(req.method == 'PUT') {
    /*
      The path of the http request will determine the service to be used.
      The url will have the form: http://node_ip:node_port/service/method
    */

      const reqURL = url.parse(req.url)

      const path = reqURL.path.split("/")
      const groupId = path[1]
      const service = path[2]
      const method = path[3]



    /*

      A common pattern in handling HTTP requests in Node.js is to have a
      subroutine that collects all the data chunks belonging to the same
      request. These chunks are aggregated into a body variable.

      When the req.on('end') event is emitted, it signifies that all data from
      the request has been received. Typically, this data is in the form of a
      string. To work with this data in a structured format, it is often parsed
      into a JSON object using JSON.parse(body), provided the data is in JSON
      format.

      Our nodes expect data in JSON format.
  */

    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
      // console.log(deserialize(body))
    })


    req.on('end', () => {
      const message = deserialize(body)
      /* Here, you can handle the service requests.
      Use the local routes service to get the service you need to call.
      You need to call the service with the method and arguments provided in the request.
      Then, you need to serialize the result and send it back to the caller.
      */
      // console.log("HERE IS THE MESSAGE");
      // console.log(message);
      // console.log("HERE IS THE SERVICE");
      // console.log(service);
      // console.log("here is the group id");
      // console.log(groupId);
      let serviceName = service;
      if(groupId != 'local') {
        serviceName = {gid: groupId, service: serviceName}
      }

      routes.get(serviceName, (e, returnedService) => {
        if(e) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end(serialize(e));
          return;
        }

        if(!returnedService[method]) {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end(serialize(Error("bad method")))
          return;
        }

        returnedService[method](...message, (e, v) => {

          if (!e) {
            global.moreStatus.counts += 1
            // res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(serialize([null, v]));

          }else if(e && v) {
            global.moreStatus.counts += 1
            // res.writeHead(200, { 'Content-Type': 'text/plain' })
            res.end(serialize([e, v]))
          }else {
            // res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end(serialize([e, null]));
          }
        })
      })

        // res.writeHead(200, { 'Content-Type': 'text/plain' });
    })
    }
  })


    // Write some code...


  /*
    Your server will be listening on the port and ip specified in the config
    You'll be calling the `callback` callback when your server has successfully
    started.

    At some point, we'll be adding the ability to stop a node
    remotely through the service interface.
  */

  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    global.distribution.node.server = server;
    callback(server);
  });

  server.on('error', (error) => {
    // server.close();
    console.log("HERE IS THE SERVER ERROR");
    console.log(error);
    log(`Server error: ${error}`);
    // console.log(error)
    throw error;
  });
};

module.exports = {
  start: start,
};
