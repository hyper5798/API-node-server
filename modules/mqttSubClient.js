var mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt.json')

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
    client.subscribe(mqttConfig.ulTopic1);
    client.subscribe(mqttConfig.ulTopic2);
    client.subscribe(mqttConfig.dlTopic);
})

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
}

function handleUpload2 (msg) {  
    let message = msg.toString()
    //console.log('handleUpload2: %s', message)
}


