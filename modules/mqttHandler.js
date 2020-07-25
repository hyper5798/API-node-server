const mqttConfig = require('../config/mqtt.json')
const mqtt = require('mqtt')
const Sequelize = require('sequelize')
const Report = require('../db/models').report
const Promise = require('bluebird')
const util = require('./util')
const io = require('socket.io-client');
const appConfig = require('../config/app.json')
let wsUrl ='http://localhost:'+appConfig.port
const socket = io.connect(wsUrl, {reconnect: true});

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
  console.log('mqtt handller receve websocket :'+m);
});


let options = {
	port: mqttConfig.port,
	protocolId: 'MQIsdp',
	protocolVersion: 3
}

class MqttHandler {
  constructor() {
    this.mqttClient = null;
    this.host = mqttConfig.host;
    this.username = mqttConfig.name; // mqtt credentials if these are needed to connect
    this.password = mqttConfig.password;
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
      this.mqttClient.end();
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
      console.log(`mqtt client disconnected`);
    });
  }

  // Sends a mqtt message to topic: mytopic
  sendMessage(topic, message) {
    this.mqttClient.publish(topic, message);
  }
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
  let value = await util.getValue(mac)
  if( value === null) {
    const Device = require('../db/models').device
    let device = await Promise.resolve(Device.findOne({where: {"macAddr":mac}}))
    if(device) {
      //util.setValue(mac, device.status)
    } else {
      console.log('???? '+ getDatestring() + ' drop mac : ' + mac);
      return null
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
}


//"ulTopic1": "YESIO/UL/+", for escape romm
async function handleUpload1 (mObj) { 

  let result = await saveMessage (mObj)

  if(result.dataValues.type_id != 99) return;

  if(result.dataValues.id){
    console.log(getDatestring() +' -> Save message success')
    let report = await Report.findOne({
      where: {
          "id":result.dataValues.id
      }
    });
    //For websocket to webui
    socket.emit('mqtt_sub',report);
    if(typeof report.data === 'string')
      report.data = JSON.parse(report.data)
    let mHash = 'escape'
    let key = report.macAddr
    if(report.key1 == 1) 
      key = key + '_start'
    if(report.key1 == 2) 
      key = key + '_end'
    if(report.key1 == 3) 
      key = key + '_pass'
  
    let value = getRecttring(report.recv)
    //For record the device triger time
    util.hsetValue(mHash, key, value)
  }
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
  let result = await saveMessage (parsingObj)
  if(result.dataValues.id){
    console.log(getDatestring() +' -> Save message success')
  }
}

async function saveMessage (jsonObj) {
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
      jsonObj.extra = JSON.stringify(jsonObj.extra)
      //Jason modify dtat to key1~8 on 2020.07.25
      //jsonObj.data = JSON.stringify(jsonObj.data)
      let keys = Object.keys(jsonObj.data)
      for(let i=0;i<keys.length;i++) {
        jsonObj[keys[i]] = jsonObj.data[keys[i]]
      }
      delete jsonObj.data
      if(jsonObj.recv === undefined ||jsonObj.recv === null)
        jsonObj.recv = new Date()
      //console.log('save jsonObj :')
      //console.log(jsonObj)
      return await Promise.resolve(Report.create(jsonObj))
  } catch (error) {
      return error
  }
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
  return date.toLocaleDateString() + ' ' +date.toLocaleTimeString()
}

function getRecttring(time) {
  let date = new Date(time)
  return date.toLocaleDateString() + ' ' +date.toLocaleTimeString()
}
