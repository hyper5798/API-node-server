
const Promise = require('bluebird')
const Type = require('../db/models').type
const Device = require('../db/models').device
const Product = require('../db/models').product
const redisHandler  = require('./redisHandler')
let redisClient = new redisHandler(0);
redisClient.connect();
setTimeout(init, 1500);

module.exports = {
  init,
  setValue,
  getValue,
  hsetValue,
  hgetValue,
  remove,
  parsingMsg,
  encode_base64,
  decode_base64
}

async function init() {

  let clean = await redisClient.flush()
  console.log('init clean redis: '+ clean)
 
  let types = await Promise.resolve(Type.findAll())
  let products = await Promise.resolve(Product.findAll())
  if(types.length>0) {
    for(let i=0; i<types.length;++i){
        let id = types[i].type_id
        let key = 'type'+id
        let fields = types[i].fields
        if(typeof fields === 'object') {
          fields = JSON.stringify(fields)
        }
        let rules = types[i].rules
        if(typeof rules === 'object') {
          rules = JSON.stringify(rules)
        }
           
        //await setValue(key, value);
        hsetValue(key, 'fieids', fields);
        hsetValue(key, 'rules', rules);
    }
  }
  if(products.length>0) {
    for(let i=0; i<products.length;++i){
        let mac = products[i].macAddr
        let key = 'products';
        let time = products[i].created_at;
        if(debug)
            console.log('mac'+mac+' -> '+ time)
        hsetValue(key, mac, time);
    }
  }
  
  //await setValue('laravel_database_mytest','12345678');
  //let test = await getValue('macfcf5c4536490');
  //console.log('init clean test: '+ test)
  //Jason mark for binding device is not often performed
  /*let products = await Promise.resolve(Product.findAll())
  if(products.length>0) {
    for(let i=0; i<products.length;++i){
        let id = products[i].id
        let mac = products[i].macAddr
        await hsetValue('product', mac, id);
    }
  }*/
}

function  setValue(key,value) {
  redisClient.setValue(key, value)
};

function  getValue(key) {
  return redisClient.getValue(key)
}

function  hsetValue(key, field, value) {
  redisClient.hsetValue(key, field, value)
};

function  hgetValue(key, field) {
  return redisClient.hgetValue(key, field)
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
        //let mapStr = await getValue(mType)
        let mapStr = await hgetValue(mType, 'rules')
        console.log(mapStr)
        if(mapStr) {
            let map = JSON.parse(mapStr)
            let mInfo = getTypeData(mData,map)
            
            if(mInfo){
                //let msg = {macAddr: mMac, data: mData, extra: mExtra, fport: obj.fport};
                let msg = {macAddr: mMac, extra: mExtra, fport: obj.fport}
                
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
