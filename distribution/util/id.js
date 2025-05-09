/** @typedef {import("../types.js").Node} Node */

const assert = require('assert');
const crypto = require('crypto');

// The ID is the SHA256 hash of the JSON representation of the object
/** @typedef {!string} ID */

/**
 * @param {any} obj
 * @return {ID}
 */
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

/**
 * The NID is the SHA256 hash of the JSON representation of the node
 * @param {Node} node
 * @return {ID}
 */
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

/**
 * The SID is the first 5 characters of the NID
 * @param {Node} node
 * @return {ID}
 */
function getSID(node) {
  return getNID(node).substring(0, 5);
}


function getMID(message) {
  const msg = {};
  msg.date = new Date().getTime();
  msg.mss = message;
  return getID(msg);
}

function idToNum(id) {
  const n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}

function consistentHash(kid, nids) {
  let newList = []
  let map = {}
  for(const nid of nids) {
    newList.push(idToNum(nid))
    map[idToNum(nid)] = nid
  }
  newList.push(idToNum(kid))
  newList.sort()
  let ind = newList.indexOf(idToNum(kid))
  if(ind == newList.length - 1) {
    ind = 0
  }else {
    ind += 1
  }
  const val = newList[ind]
  return map[val]
}


function rendezvousHash(kid, nids) {
  let newList = [];
  let map = {}
  for(let i = 0; i < nids.length; i++ ) {
    map[idToNum(getID(kid + nids[i]))] = nids[i]
    newList.push(idToNum(getID(kid + nids[i])))
  }
  newList.sort()
  return map[newList[newList.length - 1]]
}

module.exports = {
  getID,
  getNID,
  getSID,
  getMID,
  naiveHash,
  consistentHash,
  rendezvousHash,
};
