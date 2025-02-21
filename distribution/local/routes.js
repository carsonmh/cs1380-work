/** @typedef {import("../types").Callback} Callback */

const comm = require("../all/comm");
const { groups } = require("./local");

let hashMap = {}
/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) {
    const gid = configuration.gid
    if(configuration.service) {
        configuration = configuration.service
    }

    if(gid && gid != "local") {
        if(!distribution[gid]) {
            callback(new Error("GID not found. Config gid: " + gid), null)
            return
        }

        callback(null, distribution[gid][configuration])
        return
    }

    if (!hashMap[configuration] && !hashMap[configuration]) {
        console.log(configuration, hashMap, hashMap[configuration])
        callback(Error("error"), null)
        return
    }
    
    if(configuration == 'rpc') {
        callback(null, hashMap[configuration].findLocal())
    }else {
        callback(null, hashMap[configuration])
    }
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback) {
    hashMap[configuration] = service
    if (callback) {
        callback(null, hashMap[configuration]) // TODO: This or pass something else?
    }
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
    if(hashMap[configuration] == null || hashMap[configuration] == undefined ){
        callback(Error("There wasn't a function connected to this config"), null)
        return;
    }
    hashMap[configuration] = null
    callback(null, null) // TODO: Again, what to put into these values;
};

module.exports = {get, put, rem};
