const { getID } = require("../util/id");

function findLocal(functionPointer, ...args) {
    // const id = functionPointer
    // console.log('running')
    // const functionResult = toLocal[id]
    // functionResult(...args)
    return global.toLocal
}

module.exports = { findLocal }