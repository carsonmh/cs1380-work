/** @typedef {import("../types").Callback} Callback */

/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typdef {Object} Target
 * @property {string} service
 * @property {string} method
 */

/**
 * @param {object} config
 * @return {object}
 */
function comm(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {Array} message
   * @param {object} configuration
   * @param {Callback} callback
   */
  function send(message, configuration, callback) {
    let response = {}
    let errors = {}
    let count = 0

    // console.log("I AM IN ALL.COMM HERE IS MESSAGE AND CONFIGURATION");
    // console.log(message);
    // console.log(configuration);

    distribution.local.groups.get(context.gid, (e, group) => {
      if(e) {
        callback(e, null)
        return
      }
      for(const [key, value] of Object.entries(group)) {
        if(!value.ip) {
          continue
        }

        console.log(value)

        const remote = { node: value, service: configuration.service, method: configuration.method }
        distribution.local.comm.send(message, remote, (e, v) => {
          if(e) {
            errors[key] = e
          }else {
            response[key] = v
          }
          count++

          if (count >= totalInGroup(group)) {
            callback(errors, response)
          }
        })
      }
    })
  }

  return {send};
};

function totalInGroup(group) {
  let count =0 
  for(const [key, value] of Object.entries(group)) {
    if(value.ip) {
      count += 1
    }
  }

  return count
}

module.exports = comm;
