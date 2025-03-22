/** @typedef {import("../types").Callback} Callback */
/** @typedef {import("../types").Node} Node */

const { serialize, deserialize } = require("../util/serialization");
const http = require('node:http');


/**
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {Node} node
 */

/**
 * @param {Array} message
 * @param {Target} remote
 * @param {Callback} [callback]
 * @return {void}
 */
function send(message, remote, callback) {
    const messageString = serialize(message);
    const options = {
        hostname: remote.node.ip,
        port: remote.node.port,
        path: `/${remote.gid ? remote.gid : "local"}/${remote.service}/${remote.method}`,
        method: 'PUT',
      };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk.toString();
        });

        res.on('end', () => {
            const deserializedData = deserialize(data)
            if(deserializedData instanceof Error) {
                callback(deserializedData, null)
            }else if (Array.isArray(deserializedData)) {
                callback(deserializedData[0], deserializedData[1])
            }else {
                callback(null, deserializedData);
            }
        });
    })

    req.on('error', (e) => {
        callback(e, null);
    });

    req.write(messageString)
    req.end()
    return;
}

module.exports = {send};
