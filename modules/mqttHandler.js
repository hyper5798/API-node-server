
const mqttConfig = require('../config/mqtt.json')
const mqtt = require('mqtt')
const Report = require('../db/models').report
const Promise = require('bluebird')
const util = require('./util')
const io = require('socket.io-client');
const appConfig = require('../config/app.json')
let wsUrl ='http://localhost:'+appConfig.port
const socket = io.connect(wsUrl, {reconnect: true});
const redisHandler  = require('../modules/redisHandler')
let macList = [];

socket.on('connect',function(){
  socket.emit('mqtt_sub','**** mqtt_sub socket cient is ready');
});

socket.on('disconnect',function(){
  console.log('mqtt handller websocket disconnct');
  if (socket.connected === false ) {
    //socket.close()
    socket.open();
  }
});

socket.on('news',function(m){
  console.log('mqtt handller receve websocket :');
  console.log(m)
});


let options = {
	port: mqttConfig.port,
	protocolId: 'MQIsdp',
	protocolVersion: 3
}

class MqttHandler {
  constructor() {
    this.mqttClient = null
    this.host = mqttConfig.host
    this.clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8)
    this.username = mqttConfig.name // mqtt credentials if these are needed to connect
    this.password = mqttConfig.password
    this.keepalive = 60,
    this.reconnectPeriod= 1000
    this.protocolId = 'MQIsdp'
    this.protocolVersion= 3
    this.clean= true,
    this.encoding= 'utf8'
  }

  checkWSConnect() {
    console.log('Check websocket connect :' + socket.connected);
    if (socket.connected === false ) {
      //socket.close()
      socket.open();
    }
  }

   
  connect() {
    // Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
    options.host = this.host
    options.username = this.username
    options.password = this.password
    this.mqttClient = mqtt.connect(options);

    // Mqtt error calback
    this.mqttClient.on('error', (err) => {
      console.log(err);
      if(err === 'client disconnecting') 
      this.mqttClient.reconnect();
      //this.mqttClient.end();
    });

    // Connection callback
    this.mqttClient.on('connect', () => {
      console.log(`mqtt client connected`);
      this.mqttClient.subscribe(mqttConfig.ulTopic1, {qos: 0})
      this.mqttClient.subscribe(mqttConfig.ulTopic2, {qos: 0})
      this.mqttClient.subscribe(mqttConfig.dlTopic, {qos: 0})
    });

    // mqtt subscriptions
    // When a message arrives, check and switch it
    this.mqttClient.on('message', function (topic, msg) {
      swithObj(topic, msg)
    });

    this.mqttClient.on('close', () => {
      console.log(`mqtt client disconnected ` + new Date().toISOString());
    });
  }

  // Sends a mqtt message to topic: mytopic
  sendMessage(topic, message) {
    
    this.mqttClient.publish(topic, message);
  }

  saveAndSendSocket(msg) {
    let obj = getAdjustObj(msg)
    saveMessage (obj) 
    socket.emit('mqtt_sub', obj)
  }

  adjustObj(msg) {
    return getAdjustObj(msg)
  }

  saveMqttMessage(obj) { 
    return saveMessage(obj)
  }

  sendSocket(obj) { 
    socket.emit('mqtt_sub', obj)
  }
}

MqttHandler.prototype.saveAndSendMqtt = function(msg) {
  let obj = getAdjustObj(msg);
  saveMessage (obj)
  /*if(typeof obj != 'string')
    socket.emit('mqtt_sub', JSON.stringify(obj));
  else*/ 
    socket.emit('mqtt_sub', obj);
}

module.exports = MqttHandler;

//"dlTopic": "YESIO/DL/CONTROLL",
function handleDownload (topic,msg) {  
  let message = msg.toString()
  console.log('handleDownload: %s', message )
  
}

//check mac and switch by topic
async function swithObj (topic, msg) {  
  let message = msg.toString()
  let obj = getJSONObj(message)
  let mac = obj.macAddr
  
  try {
    //console.log(macList.indexOf(mac))
    if( macList.indexOf(mac)<0) {
      const Product = require('../db/models').product
      let product = await Promise.resolve(Product.findOne({where: {"macAddr":mac}}))
      if(product === null) {
        console.log('???? '+ getDatestring() + ' drop mac : ' + mac);
        return null
      } else {
        macList.push(mac)
      }
    }
    if(topic.includes('YESIO/UL'))
      handleUpload1(obj)
    else if(topic.includes('GIOT-GW/UL'))
      handleUpload2(obj)
    else if(topic.includes('YESIO/DL'))
      handleDownload(topic, msg)
    else
      console.log('No handler for topic %s', topic)
  } catch (error) {
    console.log(error.message)
  }
   
  
}


//"ulTopic1": "YESIO/UL/+", for escape room
async function handleUpload1 (mObj) { 
  console.log(getDatestring() +'mqtt_sub_YESIO/UL/+ -------------------')
  let obj = getAdjustObj(mObj);
  let result = null
  
  result = await saveMessage (obj)
  if(result.dataValues.id){
    console.log(getDatestring() +'## Save message success')
  }
  //Jason add for only keep-alive and node-ack
  
  if(obj.type_id != 99) return
  let mac = obj.macAddr
  let status = obj.key1
  let command = obj.key2
  showStatusMeg(mac, obj.key1)
  console.log(getDatestring() +'## key is '+status)

  if(command) {
    console.log(getDatestring() +'## command is '+command)
  }
  
  //要透過mac取room_id
  let redisClient = new redisHandler(0)
  redisClient.connect()
  let room_id = await redisClient.hgetValue(mac, 'room_id')
  
  if(room_id == null) return;
  let roomKey = 'room'+room_id

  
  
  //For record the door close status
  
  if( status === 10) {
    //let doorStatus = await redisClient.hgetValue(roomKey, 'door')
    let doorStatus = await redisClient.hgetValue(mac, 'door')
    doorStatus = parseInt(doorStatus)
    if(doorStatus && doorStatus===11)
      //redisClient.hsetValue(roomKey, 'door', 10)
      redisClient.hsetValue(mac, 'door', 10)
  }
  redisClient.quit()
  
  //For websocket to webui
  socket.emit('mqtt_sub',JSON.stringify(obj));
}

function showStatusMeg(_mac,_key) {
  //For 
  let key = 'start'
  switch (_key) {
    case 1:
      key = 'start'
      break
    case 2:
      key = 'end';
      break
    case 3:
      key = 'pass'
      break
    case 4:
      key = 'fail'
      break
    case 5:
      key = 'ack'
      break
    case 6:
      key = 'emergency event'
      break
    case 7:
      key = 'security event'
      break
    case 10:
      key = 'node off'
      break
    case 11:
      key = 'node on'
      break
    case 20:
      key = 'turn off'
      break
    case 21:
      key = 'turn on'
      break
    case 22:
      key = 'soft reset'
      break
    case 23:
      key = 'start node'
      break
    case 24:
      key = 'stop node'
      break
    case 25:
      key = 'overtime stop node'
      break
    case 26:
      key = 'emergency stop node'
      break
    case 30:
      key = 'game mode'
      break
    case 31:
      key = 'demo mode'
      break
    case 32:
      key = 'security mode'
      break
    default:
      console.log(`Sorry, we are out of range`)
  }
  console.log(getDatestring() +'## mac:'+_mac+', status :'+key)
}

//"ulTopic2": "GIOT-GW/UL/+"
async function handleUpload2 (jsonObj) {  

  let parsingObj = await util.parsingMsg(jsonObj)
  //console.log('topic : %s',topic)
  console.log(parsingObj)
  if(parsingObj == null) {
    console.log( '%s %s is no type (%s) parsing, drop this message', getDatestring(),mac, jsonObj.fport)
    return;
  }
  let obj = getAdjustObj(parsingObj);
  let result = await saveMessage (obj)
  if(result.dataValues.id){
    console.log(getDatestring() +' -> Save message success')
  }
}

function getAdjustObj(jsonObj) {
  try {
    jsonObj['type_id'] = parseInt(jsonObj.fport)
    delete jsonObj.fport
    jsonObj['extra'] = {}
    if(jsonObj.frameCnt !== undefined){
        jsonObj.extra['frameCnt'] = jsonObj.frameCnt
        delete jsonObj.frameCnt
    } else {
        jsonObj.extra = null
    } 
    if(jsonObj.extra != null)
      jsonObj.extra = JSON.stringify(jsonObj.extra)
    //Jason modify dtat to key1~8 on 2020.07.25
    //jsonObj.data = JSON.stringify(jsonObj.data)
    let keys = Object.keys(jsonObj.data)
    for(let i=0;i<keys.length;i++) {
      jsonObj[keys[i]] = jsonObj.data[keys[i]]
    }
    delete jsonObj.data
    if(jsonObj.recv === undefined ||jsonObj.recv === null)
      jsonObj.recv = new Date().toISOString()
    //console.log('save jsonObj :')
    //console.log(jsonObj)
    return jsonObj
  } catch (error) {
      return error
  }
}

async function saveMessage (jsonObj) {
  return await Promise.resolve(Report.create(jsonObj))
}

function getJSONObj(obj) {
  let jsonObj = {}
  if(typeof obj == 'string'){
      obj = JSON.parse(obj)
  }
  if(Array.isArray(obj)) {
      jsonObj = obj[0]
  } else {
      jsonObj = obj
  }
  return jsonObj
}

function getDatestring() {
  let date = new Date()
  return date.toISOString() + ' >>> '
  //return date.toLocaleDateString() + ' ' +date.toLocaleTimeString()
}

function getRecvString(time) {
  let date = new Date(time)
  return date.toLocaleDateString() + ' ' +date.toLocaleTimeString()
}
