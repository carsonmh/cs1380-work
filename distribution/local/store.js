/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/
const fs = require('node:fs')
const {serialize, deserialize} = require('../util/serialization')
const id = require("../util/id")
const path = require("path")

function getKeyAndGid(configuration) {
  let key = null
  let gid = null

  if(configuration && !configuration.key && !configuration.gid) {
    key = configuration
  }else {
    if(configuration && configuration.key) {
      key = configuration.key
    }
    if(configuration && configuration.gid) {
      gid = configuration.gid
    }
  }

  return [key, gid]
}

function put(state, configuration, callback) {
  let content = serialize(state)
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
  
  const path = `store/${distribution.node.config.port}/${gid}/${key}.txt`


  fs.mkdir('store', (e, v) => {
    fs.mkdir(`store/${distribution.node.config.port}`, (e, v) => {
      fs.mkdir(`store/${distribution.node.config.port}/${gid}`, (e, v) => {
        fs.writeFile(path, content, (err) => {
          if (err) {
            callback(new Error(err), null)
          } else {
            content = null
            callback(null, state)
          }
        });
      })
    })
  })
}

function get(configuration, callback) {
  let [key, gid] = getKeyAndGid(configuration)
  // console.log("IN STORE GET HERE IS KEY AND GID");
  // console.log(key, gid);

  if(!key && !gid){ 
    callback(new Error("must provide configuraiton"), null)
    return
  }


  if(!gid) {
    gid = 'local'
  }

  if(!key) {
    let arr = []
    fs.readdir(`store/${distribution.node.config.port}/${gid}`, (err, files) => {
      if(!files){ 
        callback(null, [])
        return
      }
      for (const file of files) {
        const filePath = path.join(`store/${distribution.node.config.port}/${gid}`, file);
        const key = filePath.split('/')[3].split('.')[0]
        arr.push(key)
      }
    callback(null, arr)
    })
  }else {
    fs.readFile(`store/${distribution.node.config.port}/${gid}/${key}.txt`, (err, obj) => {
      if (err) {
        callback(new Error(err), null)
      } else {
        callback(null, deserialize(obj))
      }
    });
  }
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

  fs.readFile(`store/${distribution.node.config.port}/${gid}/${key}.txt`, (err, obj) => {
    if (err) {
      callback(new Error(err), null)
    } else {
      fs.unlink(`store/${distribution.node.config.port}/${gid}/${key}.txt`, (err) => {
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
