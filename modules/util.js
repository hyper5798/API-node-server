
const Promise = require('bluebird')
const Type = require('../db/models').type
const Device = require('../db/models').device
const redisHandler  = require('./redisHandler')
let redisClient = new redisHandler(0);
redisClient.connect();
setTimeout(init, 1500);

module.exports = {
  init,
  setValue,
  getValue,
  remove,
  parsingMsg,
  encode_base64,
  decode_base64
}

async function init() {

  let clean = await redisClient.flush()
  console.log('init clean redis: '+ clean)
 
  /*let types = await Promise.resolve(Type.findAll())
  let devices = await Promise.resolve(Device.findAll())
  if(types.length>0) {
    for(let i=0; i<types.length;++i){
        let id = types[i].type_id
        let key = 'type'+id
        let value = JSON.stringify(types[i].rules)
        //checkMap[id.toString()] = JSON.parse(types[i].rules)
        if(debug)
            console.log(key + ' -> '+ value)
        await setValue(key, value);
        
    }
  }
  if(devices.length>0) {
    for(let i=0; i<devices.length;++i){
        let mac = devices[i].macAddr
        if(debug)
            console.log('mac'+mac+' -> '+ devices[i].status)
        setValue('mac'+mac, devices[i].status)
    }
  }*/
  //await setValue('laravel_database_mytest','12345678');
  //let test = await getValue('macfcf5c4536490');
  //console.log('init clean test: '+ test)
}

function  setValue(key,value) {
  redisClient.setValue(key, value)
};

function  getValue(key) {
  return redisClient.getValue(key)
}

function remove(key) {
  redisClient.remove(key)
}

async function parsingMsg(obj) {
    let fport = obj.fport
    //Get data attributes
    let mData = obj.data
    let mMac  = obj.macAddr
    let mExtra
    if(obj.time) {
        mExtra = {'gwip': obj.gwip,
                'gwid': obj.gwid,
                'rssi': obj.rssi,
                'snr' : obj.snr,
                //'fport': obj.fport,
                'frameCnt': obj.frameCnt,
                'channel': obj.channel}
    } else {
        mExtra = {
                //'fport': obj.fport,
                'frameCnt': obj.frameCnt}
    }
    //Parse data
    if(obj.fport){
        let mType = 'type'+ obj.fport
        let mapStr = await getValue(mType)
        console.log(mapStr)
            if(mapStr) {
                let map = JSON.parse(mapStr)
                let mInfo = getTypeData(mData,map)
                
                if(mInfo){
                    let msg = {macAddr: mMac, data: mData, extra: mExtra, fport: obj.fport};
                    if(obj.time){
                      msg.recv = obj.time
                    }
                    // console.log('**** '+msg.recv +' mac:'+msg.mac+' => data:'+msg.data+'\nfport:'+mExtra.fport+' info:'+JSON.stringify(mInfo));
                    msg.data=mInfo
                  
                    return Promise.resolve(msg);
                } else {
                    return Promise.resolve(null)
                }
            } else {
                return Promise.resolve(null)
            }
    } else {
        return Promise.resolve(null)
    }
  }
  
  
  function getTypeData(data,obj) {
    if (obj === undefined|| obj === null) {
        return null
    }
    try {
        let info = {}
        let keys = Object.keys(obj)
        let count = keys.length
        for(let i =0;i<count;i++){
            //console.log( keys[i]+' : '+ obj[keys[i]])
            let parseData =  getIntData(obj[keys[i]],data)
            info[keys[i]] = parseData.toFixed(2)
            // console.log(keys[i] + ' : ' + info[keys[i]])
        }
        return info
    } catch (error) {
        return null
    }
  }
  
  function getIntData(arrRange,initData){
    let ret = {}
    let start = arrRange[0]
    let end = arrRange[1]
    let diff = arrRange[2]
    let data = parseInt(initData.substring(start,end),16)
    // example : 
    // diff = "data/100"
    // data = 2000
    // eval(diff) = 2000/100 = 20
    
    return eval(diff)
  }

  function decode_base64(str) {
    return new Buffer(str, 'base64').toString();
  }

  function encode_base64(str) {
    return new Buffer(str).toString('base64');
  }
