
const gossip = function(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.subset = config.subset || function(lst) {
    return Math.ceil(Math.log(lst.length));
  };

  return {
    send: (payload, remote, callback) => {
      callback = callback || function() { };
      console.log("here is the payload in send");
      console.log(payload);
      // console.log("ehre is remote");
      // console.log(remote);
      // make it comms.send but with gossip
      global.distribution.local.groups.get(context.gid, (err, nodes) => {
        if (err) {
          callback(err, null);
          return;
        }
        // console.log("here are the nodes");
        // console.log(nodes);
        // console.log("here is the context subset");
        // console.log(context.subset);

        // get a random subset and then copy comm w
        const get_ran_subset = (keys) => {
          const subset_selected = [];
          // 
          const max_nodes = Math.round(Math.log(keys.length));
          
          while (subset_selected.length < max_nodes) {
            subset_selected.push(keys[Math.floor(Math.random() * keys.length)]);
          }
          return subset_selected;
        };

        const random_nodes = get_ran_subset(Object.keys(nodes));
        // console.log("here are the random nodes");
        // console.log(random_nodes);
        let remaining = Object.keys(nodes).length;
        const responses = {};
        const errors = {};

        // message = payload;
        console.log("here is payload - distributed");
        console.log(payload);
        
        if (!payload.mid || !payload.gid) {
          payload = {
            message: payload[0],
            remote: remote,
            mid: global.distribution.util.id.getMID(payload),
            gid: context.gid,
          };
        } else {
          payload = {
            message: payload[0],
            remote: remote,
            mid: global.distribution.util.id.getMID(payload),
            gid: context.gid,
          };
        }

        if (remaining === 0) {
          callback(new Error('no nodes'));
          return;
        }

        for (const node_id of random_nodes) {
          const nod = {
            ip: nodes[node_id].ip,
            port: nodes[node_id].port,
          };

          const remote = {
            service: 'gossip',
            method: 'recv',
            node: nod,
            gid: 'local',
          };

          // console.log("ehre is nod and removte");
          // console.log(nod);
          // console.log(remote);
          
          // console.log(payload);

          global.distribution.local.comm.send(payload, remote, (err, res) => {
            if (err) {
              errors[node_id] = err;
            } else {
              responses[node_id] = res;
            }

            remaining--;
            // console.log("here is hte response");
            // console.log(res);
            // console.log("here is the error");
            // console.log(err);

            if (remaining === 0) {
              // edit this callback (I am not sure that this is 100% correct) -> probably try access the errors
              // console.log('HERE IS ERRROR/RESPONSE');
              // console.log(errors);
              // console.log(responses);
              callback(errors, responses);
              return;
            }
          });
        };
      });
    },

    at: (period, func, callback) => {
      callback = callback || function() { };
      const intervalID = setInterval(func, period);
      // if (callback) {
      callback(null, intervalID);
      // }
    },

    del: (intervalID, callback) => {
      callback = callback || function() { };
      clearInterval(intervalID);
      // if (callback) {
      callback(null, intervalID);
      // }
    },
  };
};
// { send: [Function: send], at: [Function: at], del: [Function: del] }
module.exports = gossip;
