var mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt.json')
const redis  = require('./redisClient')
var Promise = require('bluebird')

var options = {
	port: mqttConfig.port,
    host: mqttConfig.host,
    username: mqttConfig.name,
    password: mqttConfig.password,
	protocolId: 'MQIsdp',
	protocolVersion: 3
}

var client = mqtt.connect(options)

client.on('connect', function()  {
    console.log(new Date() + ' start connect MQTT' );
    setValue('test', '12345')
    client.subscribe(mqttConfig.ulTopic1)
    client.subscribe(mqttConfig.ulTopic2)
    client.subscribe(mqttConfig.dlTopic)
})

let  setValue = async (key,value) => {
    let result =  await redis.setAsync(key, value);
    return Promise.resolve(result)
};


let  getValue = async (key) => {
    let value = await redis.getAsync(key);
    return Promise.resolve(value)
};

client.on('message', (topic, msg) => {  
    
    if(topic.includes('YESIO/UL'))
        return handleUpload1(msg)
    else if(topic.includes('GIOT-GW/UL'))
        return handleUpload2(msg)
      //For download message
    else if(topic.includes('YESIO/DL'))
        return handleDownload(msg)
    else
        console.log('No handler for topic %s', topic)
})

client.on('disconnect', function() {
	console.log(new Date() + ' ****** mqtt disconnect' )
	client = mqtt.connect(options)
})

function handleDownload (msg) {  
    let message = msg.toString()
    console.log('handleDownload: %s', message)
}
  
function handleUpload1 (msg) {  
    let message = msg.toString()
    console.log('handleUpload1: %s', message)
    let result = saveMessage (message)
    console.log(result)
}
async function handleUpload2 (msg) {  
    //let result = await setValue('test', '45678');
    //let test = await getValue('test');
    let message = msg.toString()
    //console.log('handleUpload2: %s', message)
    //console.log('getValue(key): %s', test)
}

async function saveMessage (obj) {
    let newReport = null
    try {
        const Report = require('../db/models').Report
        let jsonObj = getJSONObj(obj)
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

        console.log('save jsonObj :')
        console.log(jsonObj)
        return await Report.create(obj)
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



