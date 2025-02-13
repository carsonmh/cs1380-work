/** @typedef {import("../types").Callback} Callback */

let hashMap = {}
/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) {
    if (!hashMap[configuration]) {
        callback(new Error("this is an error. Config: " + configuration), null)
        return;
    }
    callback(null, hashMap[configuration])
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback) {
    hashMap[configuration] = service
    if (callback != null && callback != undefined) {
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
