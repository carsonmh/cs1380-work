const { getID } = require("../util/id");

function findLocal(functionPointer, ...args) {
    const id = getID(functionPointer)
    const functionResult = toLocal[id]
    functionResult(...args)
}

module.exports = {findLocal}