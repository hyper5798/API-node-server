
'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const responseTime = require('response-time')
const responsePoweredBy = require('response-powered-by')
const cors = require('cors')
const http = require('http')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const errorhandler = require('errorhandler')
const debug = true
global.debug = debug
let mqttHandler = require('./modules/mqttHandler')
const userController = require('./controllers/userController')
const reportController = require('./controllers/reportController')
const setCurrentUser = require('./middleware/setCurrentUser.js')
const appConfig = require('./config/app.json')
const resResources = require('./lib/resResources')
const Command = require('./db/models').command
const mqttConfig = require('./config/mqtt.json')
const dataResources = require('./lib/dataResources')
const redisHandler  = require('./modules/redisHandler')
let roomObj = {}
let missionObj = {}
let scriptObj = {}
let actionScript = {}
let action = {}
let macObj = {}

//Jason add on 2020.02.16 - start
const RED = require("node-red")

const setting = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/",
    userDir:"./.nodered/",
    functionGlobalContext: {
    }    // enables global context
}

let options = {
  swaggerDefinition: {
    info: {
      description: 'This is a sample server',
      title: 'Swagger',
      version: '1.0.0'
    },
    host: 'localhost:'+appConfig.port,
    basePath: '/',
    produces: ['application/json', 'application/xml'],
    schemes: ['http', 'https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: ''
      }
    }
  },
  route: {
    url: '/swagger',
    docs: '/swagger.json' //swagger文件 api
  },
  basedir: __dirname, //app absolute path
  files: ['./controllers/*.js'] //Path to the API handle folder
}


module.exports = async function createServer () {
  
  const app = express()
  let mqttClient = new mqttHandler();
  mqttClient.connect();
  //const expressSwagger = require('express-swagger-generator')(app)
  //expressSwagger(options)

  app.use(errorhandler())

  // Set express server port
  app.set('port', process.env.PORT || appConfig.port)
  app.use(morgan('dev'))
  app.use(bodyParser.urlencoded({ extended: false, inflate: true }))
  app.use(bodyParser.json({ strict: true, inflate: true }))
  app.use(responsePoweredBy("@JASON_HUANG"))
  app.use(responseTime())
  app.use(cors())

  app.all('/*', function(req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    // Set custom headers for CORS
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    next()
  })

  app.get('/', function(req, res) {
    res.json({ message: 'MQTT Client and API!' });
  })

  app.get("/send_control", function(req, res) {
    return sendControl(req, res, mqttClient)
  })

  app.get('/reports/write', reportController.write)
  app.get('/reports/read', reportController.read)

  app.get("/escape/Action", function(req, res) {
    return setMissionAction(req, res, mqttClient)
  })

  app.get("/escape/stop", function(req, res) {
    return setMissionRecord(req, res, mqttClient, 6)
  })

  app.get("/escape/start", function(req, res) {
    return setMissionStart(req, res, mqttClient)
  })

  app.get("/escape/status", function(req, res) {
    let room_id = req.body.room_id || req.query.room_id
    if(action[room_id] == undefined)
      action[room_id] = 0
    return resResources.getDtaSuccess(res, action[room_id])
  })

  /**
   * Routes for the application
   */
  app.post('/users/login', userController.login)
  app.post('/users/register', userController.register)

  //Set token check middleware
  if(!debug)
    app.use(setCurrentUser)
  
  //MQTT publish
  app.post("/send_mqtt", function(req, res) {
    let topic = req.body.topic || req.query.topic
    let message = req.body.message || req.query.message
    if(message == undefined)
      return resResources.missPara(res)
    if(topic == undefined || topic == null)
      topic = mqttConfig.dlTopic//Default topic
    mqttClient.sendMessage(topic, message);
    return resResources.doSuccess(res, "Message sent to mqtt")
  });

  app.post("/send_command", function(req, res) {
    return sendCommand(req, res, mqttClient)
  });

  //app.use('/', require('./routes/mySubApp'))
  app.use('/users', require('./routes/userRoute'))
  app.use('/cps', require('./routes/cpRoute'))
  app.use('/roles', require('./routes/roleRoute'))
  app.use('/types', require('./routes/typeRoute'))
  app.use('/devices', require('./routes/deviceRoute'))
  app.use('/classes', require('./routes/classRoute'))
  app.use('/commands', require('./routes/commandRoute'))
  app.use('/settings', require('./routes/settingRoute'))
  //app.use('/reports', require('./routes/reportRoute'))

  const server = http.createServer(app).listen(app.get('port'), '0.0.0.0', () => {
    console.log("Server started at http://localhost:" + app.get('port') + "/")
  })
  
  
  //Websocket ------------------------------------------------------- start
  /*const SocketServer = require('ws').Server

  //將 express 交給 SocketServer 開啟 WebSocket 的服務
  const wss = new SocketServer({ server })

  wss.on('connection', ws => {
    console.log('Client connected :')

    ws.on('message', data => {
        //取得所有連接中的 client
        let clients = wss.clients

        //做迴圈，發送訊息至每個 client
        clients.forEach(client => {
            client.send(data)
        })
    })

    ws.on('close', () => {
        console.log('Close connected')
    })
  })*/
  //Socket.io ------------------------------------------------------- start
  var io = require('socket.io').listen(server);

  io.sockets.on('connection', function (socket) {
    // mySocket = socket;
    // socket.emit() ：向建立该连接的客户端广播
    // socket.broadcast.emit() ：向除去建立该连接的客户端的所有客户端广播
    // io.sockets.emit() ：向所有客户端广播，等同于上面两个的和
    socket.emit('news', { hello: 'world' });

    socket.on('web', function (data) {
      console.log(data);
      mqttClient.checkWSConnect();
    });//send_switch_command

    socket.on('mqtt_sub', function (data) {
      console.log('mqtt_sub : ');
      console.log( data);
      socket.broadcast.emit('update_command_status', data);
    });

    socket.on('reply_command_status', function (data) {
      console.log('reply_command_status' + JSON.stringify(data));  
      socket.broadcast.emit('update_command_status', data);
    });

    socket.on('disconnect', function () {
      console.log('???? socket disconnect id : ' + socket.id);
    });
  });

  if(debug) {
    // Initialise the runtime with a server and settings
    RED.init(server,setting);

    // Serve the editor UI from /red
    app.use(setting.httpAdminRoot,RED.httpAdmin);

    // Serve the http nodes UI from /api
    app.use(setting.httpNodeRoot,RED.httpNode);

    // Start the runtime
    RED.start();
  }
  
  // Create http server and attach express app on it
  return server

}

async function sendCommand(req, res, mqttClient) {
  let type_id = req.body.type_id || req.query.type_id
  let macAddr = req.body.macAddr || req.query.macAddr
  let cmd_name = req.body.cmd_name || req.query.cmd_name
  if(type_id == undefined || macAddr == undefined || cmd_name == undefined)
        return resResources.missPara(res)
  let topic = req.body.topic || req.query.topic
  if(topic == undefined || topic == null)
    topic = mqttConfig.dlTopic//Default topic
  let Commands = await Promise.resolve(Command.findAll({
    where: {
        "type_id": type_id,
        "cmd_name": cmd_name
    }
  }))
  if(Commands.length>0){
    console.log(Commands[0]['command'])
    let cmd = Commands[0]['command']
    if(cmd == null)
      return resResources.notFound(res)
    let message = JSON.stringify({"macAddr": macAddr, "cmd": cmd})
    mqttClient.sendMessage(topic, message);
    return resResources.doSuccess(res, "Message sent to mqtt")
  }
  else
    return resResources.notFound(res)
}

async function sendControl(req, res, mqttClient) {
  let topic = req.params.topic || req.query.topic
  let key = req.params.key || req.query.key
  if(key == undefined)
    return resResources.missPara(res)
  if(topic == undefined || topic == null)
    topic = mqttConfig.dlTopic//Default topic
  let str = decode_base64(key)
  let arr = str.split(':')
  //arr[0] : mac, arr[1]: command id
  if(arr.length != 2)
    return resResources.missPara(res)
   
  let Commands = await Promise.resolve(Command.findAll({
    where: {
        "id": arr[1],
    }
  }))
  if(Commands.length>0){
    console.log(Commands[0]['command'])
    let cmd = Commands[0]['command']
    if(cmd == null)
      return resResources.notFound(res)
    let message = JSON.stringify({"macAddr": arr[0], "cmd": cmd})
    mqttClient.sendMessage(topic, message);
    return resResources.doSuccess(res, "Control sent to mqtt")
  }
  else
    return resResources.notFound(res)
}

function decode_base64(str) {
  return new Buffer(str, 'base64').toString()
}

async function setMissionAction(req, res, mClient) {
  
  //let topic = mqttConfig.dlRoomTopic//Escape dl topic
  let time = new Date().toISOString()
  console.log(time+' setMissionAction -------------------');
  let redisClient = new redisHandler(0)
  redisClient.connect()
  let user_id = req.body.user_id || req.query.user_id
  let room_id = req.body.room_id || req.query.room_id
  if(user_id === undefined || room_id === undefined)
      return resResources.missPara(res)
  
  let idList = []
  let roomKey = 'room'+room_id
  let team = await dataResources.getTeam(user_id)
  let teamUsers = await dataResources.getTeamUsers(team.team_id)
  //Get room
  if(roomObj[room_id] === undefined || typeof(roomObj[room_id]) != 'object') {
    roomObj[room_id] = await dataResources.getRoom(room_id)
    let room = roomObj[room_id]
    if(room === null) 
      return resResources.notFound(res, 'Not found room')

    redisClient.hsetValue(roomKey,'room_name', room.room_name)
    redisClient.hsetValue(roomKey,'pass_time', room.pass_time)
  } 
  //Get all of missions of room
  if(missionObj[room_id] === undefined || typeof(missionObj[room_id]) != 'object') {
    missionObj[room_id] = await dataResources.getMissions(room_id)
  }
  //Get all of scripts of room
  if(scriptObj[room_id] === undefined || typeof(scriptObj[room_id]) != 'object') {
    let allList = await dataResources.getScripts(room_id)
    let test = {}
    //Group by mission id
    for(let i=0;i<allList.length;i++) {
      let item = allList[i]
      if(test[item.mission_id] === undefined) {
        test[item.mission_id] = []
      }
      test[item.mission_id].push(item)
    }
    scriptObj[room_id] = test
  }
  let room = JSON.parse(JSON.stringify(roomObj[room_id]))
  let missions = JSON.parse(JSON.stringify(missionObj[room_id]))
  let scripts = JSON.parse(JSON.stringify(scriptObj[room_id]))
  
  //console.log(typeof room)
  //console.log(typeof missions)
  console.log(typeof scripts)
  
  //Get all of user id in team
  for(let i=0;i<teamUsers.length;i++) {
    let item = teamUsers[i]
      idList.push(item.user_id)
  }
  //Set default action
  if(action[room_id] === undefined) {
    action[room_id] = 0
  }

  //Get mission and random script & action = 1 => init room and mission for redis
  if(action[room_id] === 0) {
    action[room_id] = 1
    //Delete emergency mission
    redisClient.hsetValue(roomKey, 'count', (missions.length-1) )
    let mStr = ''
    for(let i=0;i<missions.length;i++) {

      let mission = missions[i]

      if(mission.sequence === null)
        continue

      let mac = mission.macAddr
      //Filter emergency mac of room 
      if(mission.sequence != 0) {
        //redisClient.hsetValue(roomKey, mission.sequence, mac)
        mStr = mStr + mission.macAddr + ','
      } 
      //redisClient.hsetValue(missionkey, 'mission_id', mission.id)
      redisClient.hsetValue(mac, 'room', time)
      redisClient.hsetValue(mac, 'sequence', mission.sequence)
      redisClient.hsetValue(mac, 'mission_name', mission.mission_name)
      //redisClient.hsetValue(missionkey, 'device_id', mission.device_id)
      //Filter sequence 0 -> for emergency no script
      if(mission.sequence == 0)
        continue
      actionScript[mission.id] = getScript(scripts[mission.id])
    }
    mStr = mStr.substring(0,mStr.length-1);
    redisClient.hsetValue(roomKey, 'macs', mStr )
  }
  let target = null
  
  //Set script to mission
  for(let i=0;i<missions.length;i++) {
    let mission = missions[i]
    
    if(mission.sequence === null || mission.sequence === 0)
        continue
    let mac = mission.macAddr
    mission['script'] = actionScript[mission.id]
    if(mission.sequence === 1) {
      target = mac
    }
    //Send MQTT pass to node
    if(mac != undefined && mission.sequence != 0) {
      let pass = mission.script.pass
      if(typeof pass === 'string')
        pass = JSON.parse(pass)
        let topic = 'YESIO/DL/'+mac
      let message = JSON.stringify({"macAddr": mac, "pass": pass})
      mClient.sendMessage(topic, message)
    }
  }
  //First mission start
  if(target != null) {
    redisClient.hsetValue(target, 'start', time)
    redisClient.hsetValue(roomKey, 'sequence', 1)
    save2SendSocket(mClient, target, 1, time)
  }
  
  let data = {"room":room, "missions":missions, "ids":idList}
  return resResources.getDtaSuccess(res, data)
}

async function setMissionRecord(req, res, mClient, status) {
  
  //let topic = mqttConfig.dlRoomTopic//Escape dl topic
  let mytime = new Date().toISOString()
  console.log(mytime+' setMissionStop -------------------');
  let room_id = req.body.room_id || req.query.room_id
  if(room_id === undefined)
      return resResources.missPara(res)
  let roomKey = 'room'+room_id
  
  action[room_id] = 0
  let sequence = await hgetValue(roomKey, 'sequence')
  if(sequence === null) {
    return resResources.notAllowed(res)
  }
  let index = parseInt(sequence) - 1
  let str = await hgetValue(roomKey, 'macs')
  if(str === null) {
    return resResources.notAllowed(res)
  }
  let arr = str.split(',')
  let mac = arr[index]
  hsetValue(mac, 'stop', mytime)
  save2SendSocket(mClient, mac, status, mytime)
  
  //For record
  /*let obj = {}
  let roomStart, roomEnd
  for(let i=0; i<arr.length; i++) {
    let mac = arr[i]
    let start,end
    let mTime = mytime
    if(i < index) {
      start = await hgetValue(mac, 'start')
      end = await hgetValue(mac, 'stop')
      if(i===0){
        roomStart = start
      }
    } else if(i === index){
      start = await hgetValue(mac, 'start')
      end = mTime
      roomEnd = mTime
    } 
    obj[mac] = {"start": start, "end": end, 'time': getDiff(start, end)}
  }
  
  console.log(obj)*/
  
  
  return resResources.doSuccess(res, 'Stop the game')
}

function getDiff(time1, time2) {
  let new1 = Date.parse(time1)
  let new2 = Date.parse(time2)
  let timestamp = Math.ceil((new2-new1)/1000)
  return timestamp
}

async function setMissionStart(req, res, mClient) {
  let time = new Date().toISOString()
  console.log(time+' setMissionStart -------------------')
  let room_id = req.body.room_id || req.query.room_id
  let sequence = req.body.sequence || req.query.sequence
  if(room_id === undefined || sequence === undefined)
      return resResources.missPara(res)
  
  let roomKey = 'room'+room_id
  let currentSequence = await hgetValue(roomKey, 'sequence')
  if(currentSequence != null) {
    currentSequence = parseInt(currentSequence)
  }
  sequence = parseInt(sequence)  
  if(sequence < currentSequence)
    return resResources.notAllowed(res, 'Sequence is less then last one')
  let index = sequence - 1 
  let str = await hgetValue(roomKey, 'macs')
  if(str === null) {
    return resResources.notAllowed(res)
  }
  let arr = str.split(',')
  let mac2 = arr[index]
  let mac1 = arr[index-1]
  console.log('sequence:' + sequence)
  console.log('mac1:' + mac1)
  console.log('mac2:' + mac2)
  
  if(mac1 === undefined) {
    return resResources.notFound(res, 'Not find out mission')
  }
  
  save2SendSocket(mClient, mac1, 2, time)
  hsetValue(mac1, 'stop', time)
  hsetValue(mac2, 'start', time)
  save2SendSocket(mClient, mac2, 1, time)
  hsetValue(roomKey, 'sequence', sequence)
  
  return resResources.doSuccess(res, 'Start mission OK')
}

function getScript(list) {
  //console.log(list)
  let num = getRandom(list.length)
  console.log('getScript number = ',num)
  return JSON.parse(JSON.stringify(list[num]))
}

function getRandom(x){
  return Math.floor(Math.random()*x);
};

function hsetValue(key, fieids, value) {
  let redisClient = new redisHandler(0);
  redisClient.connect();
  redisClient.hsetValue(key, fieids, value);
}

function hgetValue(key, fieids, value) {
  let redisClient = new redisHandler(0);
  redisClient.connect();
  return redisClient.hgetValue(key, fieids, value)
}

function save2SendSocket(client, mac, status, time) {
  let mobj = {"macAddr":mac,"data":{"key1":status},"fport":99, "recv":time}
  client.saveAndSendSocket(mobj) 
}


