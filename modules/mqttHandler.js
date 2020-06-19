const mqttConfig = require('../config/mqtt.json')
const mqtt = require('mqtt')
const Sequelize = require('sequelize')
const Report = require('../db/models').report
const Promise = require('bluebird')
const util = require('./util')
const io = require('socket.io-client');
const appConfig = require('../config/app.json')
let wsUrl ='http://localhost:'+appConfig.port
const socket = io.connect('wsUrl', {reconnect: true});

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
    //this.mqttClient.subscribe('mytopic', {qos: 0});

    // When a message arrives, console.log it
    this.mqttClient.on('message', function (topic, msg) {
      let message = msg.toString()
      if(topic.includes('YESIO/UL'))
        return handleUpload1(topic,message)
      else if(topic.includes('GIOT-GW/UL'))
          return handleUpload2(topic,message)
        //For download message
      else if(topic.includes('YESIO/DL'))
          return handleDownload(topic,message)
      else
          console.log('No handler for topic %s', topic)
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
  console.log('handleDownload: %s', message)
  
}


//"ulTopic1": "YESIO/UL/+",
async function handleUpload1 (topic,msg) {  
  
  let message = msg.toString()
  console.log(' topic : %s \n message : %s',topic, message)
  let mObj = getJSONObj(message)
  socket.emit('mqtt_sub',mObj);
  let result = await saveMessage (mObj)
  if(result.dataValues.id){
    let date = new Date();
    date.toLocaleString();
    console.log(date +' -> Save message success')
    let report = await Report.findAll({
      where: {
          "id":result.dataValues.id
      }
    });
    socket.emit('mqtt_sub',report[0]);
  }
}

//"ulTopic2": "GIOT-GW/UL/+"
async function handleUpload2 (topic,msg) {  
  //let test = await getValue('test');
  let message = msg.toString()
  let jsonObj = getJSONObj(message)
  //Filter mac ---------------------------------------------------------- start
  let mac=jsonObj.macAddr
  let macStatus = await util.getValue('mac'+mac);
  //console.log('macStatus : %s', macStatus)
  if(macStatus==null || macStatus == '0') {
    console.log( '%s %s is not active, drop this message', getDatestring(),mac)
    return;
  }
  //Parsing message ------------------------------------------------------ start
  let parsingObj = await util.parsingMsg(jsonObj)
  console.log('topic : %s',topic)
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

function saveMessage (jsonObj) {
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
      jsonObj.data = JSON.stringify(jsonObj.data)
      //jsonObj.recv = Sequelize.literal('CURRENT_TIMESTAMP')
      //console.log('save jsonObj :')
      //console.log(jsonObj)
      let result = Report.create(jsonObj)
      return Promise.resolve(result)
      //return await Report.create(jsonObj)
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
