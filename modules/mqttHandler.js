const mqttConfig = require('../config/mqtt.json')
const mqtt = require('mqtt')
const Sequelize = require('sequelize')
const Report = require('../db/models').Report

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
        return handleUpload1(message)
      else if(topic.includes('GIOT-GW/UL'))
          return handleUpload2(message)
        //For download message
      else if(topic.includes('YESIO/DL'))
          return handleDownload(message)
      else
          console.log('No handler for topic %s', topic)
    });

    this.mqttClient.on('close', () => {
      console.log(`mqtt client disconnected`);
    });
  }

  // Sends a mqtt message to topic: mytopic
  sendMessage(message) {
    this.mqttClient.publish('mytopic', message);
  }
}

module.exports = MqttHandler;

//"dlTopic": "YESIO/DL/CONTROLL",
function handleDownload (msg) {  
  let message = msg.toString()
  console.log('handleDownload: %s', message)
}


//"ulTopic1": "YESIO/UL/+",
function handleUpload1 (msg) {  
  let message = msg.toString()
  console.log('handleUpload1: %s', message)
  let mObj = getJSONObj(message)
  let result = saveMessage (mObj)
  console.log(result)
}

//"ulTopic2": "GIOT-GW/UL/+"
async function handleUpload2 (msg) {  
  //let result = await setValue('test', '45678');
  //let test = await getValue('test');
  let message = msg.toString()
  //console.log('handleUpload2: %s', message)
  //console.log('getValue(key): %s', test)
}

async function saveMessage (jsonObj) {
  let newReport = null
  try {
      
      
      // console.log('jsonObj :')
      // console.log(jsonObj)
      
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
      jsonObj.recv = Sequelize.literal('CURRENT_TIMESTAMP')
      console.log('save jsonObj :')
      console.log(jsonObj)
      return await Report.create(jsonObj)
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