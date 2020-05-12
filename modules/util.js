const redis  = require('./redisClient')
const Promise = require('bluebird')
const Type = require('../db/models').Type
const Device = require('../db/models').Device

init()

module.exports = {
  init,
  setValue,
  getValue,
  parsingMsg
}

async function init() {
  let clean =  await Promise.resolve(redis.flushallAsync())
  console.log('init clean : '+ clean)
 
  let types = await Promise.resolve(Type.findAll())
  let devices = await Promise.resolve(Device.findAll())
  if(types.length>0) {
    for(let i=0; i<types.length;++i){
        let id = types[i].type_id
        //checkMap[id.toString()] = JSON.parse(types[i].rules)
        //console.log('type'+id+' -> '+typeof types[i].rules)
        await setValue('type'+id, types[i].rules);
    }
  }
  if(devices.length>0) {
    for(let i=0; i<devices.length;++i){
        let mac = devices[i].macAddr
        console.log('mac'+mac+' -> '+typeof devices[i].status)
        await setValue('mac'+mac, devices[i].status);
    }
  }
}

async function  setValue(key,value) {
  let result =  await redis.setAsync(key, value);
  return Promise.resolve(result)
};


async function  getValue(key) {
  let value = await redis.getAsync(key);
  return Promise.resolve(value)
};

