
const id = require("../util/id")

let kvMap = {'local': {}};

function put(state, configuration, callback) {
    if(!configuration) {
        kvMap['local'][id.getID(state)] = state
        callback(null, state)
        return
    }
    if(!configuration.key && !configuration.gid) {
        kvMap['local'][configuration] = state
        callback(null, state)
        return
    }
    if(!kvMap[configuration.gid]) {
        kvMap[configuration.gid] = {}
    }
    if(!configuration.key) {
        const key = id.getID(state)
        kvMap[configuration.gid][key] = state
        callback(null, kvMap[configuration.gid][key])
    }else {
        kvMap[configuration.gid][configuration.key] = state
        callback(null, kvMap[configuration.gid][configuration.key])
    }
};

function get(configuration, callback) {
    if(!configuration) {
        callback(null, Object.keys(kvMap['local']))
        return
    }
    if(configuration.gid && !configuration.key) {
        if(kvMap[configuration.gid]) {
            const val = Object.keys(kvMap[configuration.gid])
            // console.log(val)
            callback(null, val)
            return
        }else {
            callback(null, [])
            return
        }
    }

    if(!configuration.gid && !configuration.key) { // case for string
        if(!kvMap['local'][configuration]) {
            callback(Error("not found"), null)
        }else{
            callback(null, kvMap['local'][configuration])
        }
        return
    }

    if(!configuration.key) {
        callback(Error("can't do this"), null)
        return
    }

    if(!kvMap[configuration.gid] || !kvMap[configuration.gid][configuration.key]) {
        callback(Error("not found"), null)
        return
    }
    callback(null, kvMap[configuration.gid][configuration.key])
}

function del(configuration, callback) {
    if(!configuration) {
        callback( Error("must provide valid configuration"), null)
        return
    }
    if(configuration.gid && !configuration.key) {
        callback(Error("must provide valid configuration"), null)
        return
    }

    if(!configuration.gid && !configuration.key) { // case for string
        if(kvMap['local'][configuration]) {
            const val = kvMap['local'][configuration]
            delete kvMap['local'][configuration]
            callback(null, val)
            return
        } else {
            callback(Error("not found"), null)
            return
        }
        return
    }

    if(!configuration.key) {
        callback(kvMap[configuration.gid], null)
        return
    }

    if(kvMap[configuration.gid] && kvMap[configuration.gid][configuration.key]) {
        const val = kvMap[configuration.gid][configuration.key]
        delete kvMap[configuration.gid][configuration.key]
        callback(null, val)
    }else {
        callback(Error("Not found"), null)
    }
};

module.exports = {put, get, del};
