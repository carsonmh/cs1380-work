/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/
const fs = require('node:fs')
const {serialize, deserialize} = require('../util/serialization')
const id = require("../util/id")
const { assert } = require('node:console')

function getKeyAndGid(configuration) {
  let key = null
  let gid = null

  if(configuration && !configuration.key && !configuration.gid) {
    key = configuration
  }else if(configuration && configuration.key) {
    key = configuration.key
  }
  if(configuration && configuration.gid) {
    gid = configuration.gid
  }

  return [key, gid]
}

function put(state, configuration, callback) {
  const content = serialize(state)
  let [key, gid] = getKeyAndGid(configuration)
  if(!key) {
    key = id.getID(state)
  }
  if(!gid) {
    gid = 'local'
  }

  if(key == null && configuration == null) {
    callback(new Error("Invalid"), null)
    return
  }
  
  const path = `store/${gid}-${key}.txt`

  fs.writeFile(path, content, (err) => {
    if (err) {
      callback(new Error(err), null)
    } else {
      callback(null, state)
    }
  });
}

function get(configuration, callback) {
  let [key, gid] = getKeyAndGid(configuration)

  if(!key && !gid){ 
    callback(new Error("must provide configuraiton"), null)
    return
  }


  if(!gid) {
    gid = 'local'
  }
  fs.readFile(`store/${gid}-${key}.txt`, (err, obj) => {
    if (err) {
      callback(new Error(err), null)
    } else {
      callback(null, deserialize(obj))
    }
  });
}

function del(configuration, callback) {
  let [key, gid] = getKeyAndGid(configuration)
  if(!key && !gid){ 
    callback(new Error("must provide configuraiton"), null)
    return
  }
  
  if(!gid) {
    gid = 'local'
  }
  fs.readFile(`store/${gid}-${key}.txt`, (err, obj) => {
    if (err) {
      callback(new Error(err), null)
    } else {
      fs.unlink(`store/${gid}-${key}.txt`, (err) => {
        if (err) {
          callback(new Error(err), null)
        } else {
          callback(null, deserialize(obj))
        }
      });
    }
  });
}

module.exports = {put, get, del};
