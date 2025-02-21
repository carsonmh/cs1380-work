const { id } = require("../util/util");

const groups = {};

groups.get = function(name, callback) {
    if(!groups[name]) {
        if(callback) {
            callback(Error("This shouldn't happen"), null);
        }
        return
    }

    const group = groups[name]
    if(callback) {
        callback(null, group)
    }
};

groups.put = function(config, group, callback) {

    if(config.gid) {
        config = config.gid
    }
    config = {gid: config}

    groups[config.gid] = group
    distribution[config.gid] = {}
    distribution[config.gid]['routes'] = require('../all/routes')(config)
    distribution[config.gid]['comm'] = require('../all/comm')(config)
    distribution[config.gid]['status'] = require('../all/status')(config)
    distribution[config.gid]['groups'] = require('../all/groups')(config)
    for(const [key, value] of Object.entries(group)) {
        if(!distribution['all'][key]) {
            distribution['all'][key] = value
        }
    }

    if(callback){
        callback(null, group)
    }
};

groups.del = function(name, callback) {
    if(!groups[name]) {
        if(callback) {
            callback(Error("you can't do this"), null)
        }
        return
    }


    for(const [key, value] of Object.entries(groups[name])) {
        if(distribution['all'][key]) {
            delete distribution['all']['key']
        }
    }

    const retVal = groups[name]

    delete groups[name]
    if(callback) {
        callback(null, retVal)
    }
};

groups.add = function(name, node, callback) {
    if(!groups[name]) {
        if(callback) {
            callback(new Error("you can't do this"), null)
        }
        return
    }

    groups[name][id.getSID(node)] = node

    if(!distribution['all'][id.getSID(node)]){
        distribution['all'][id.getSID(node)] = node
    }

    if(callback) {
        callback(null, groups[name])
    }
};

groups.rem = function(name, node, callback) {
    if(!groups[name] || !groups[name][node]) {
        if(callback) {
            callback(Error("This shouldn't happen"), null)
        }
        return
    }

    delete groups[name][node]

    if(distribution['all'][node]) {
        delete distribution['all'][node]
    }
    if(callback) {
        callback(null, groups[name])
    }
};

module.exports = groups;
