
'use strict'

/*!
 * Module dependencies
 */
const isTest = true //true: no save record and team record
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
const file = require('./modules/fileTools')
let roomObj = {}
let missionObj = {}
let scriptObj = {}
let actionScript = {}
let action = {}
let trCount = 0
let rCount = 0
let actionCount = 0
let errorObj = []
let roomPath = './config/room.json';
let missionPath = './config/missionjson';

//Jason add on 2020.02.16 - start
const RED = require("node-red")

const setting = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/",
    userDir:"./.nodered/",
    functionGlobalContext: {
    }    // enables global context
}


/*let options = {
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
}*/




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

  app.get("/escape/action", function(req, res) {
    //For first mission
    return setMissionAction(req, res, mqttClient)
  })

  app.get("/escape/stop", function(req, res) {
    //For emergency stop
    return setMissionRecord(req, res, mqttClient, 6)
  })

  app.get("/escape/pass", function(req, res) {
    //For pass all of mission
    return setMissionRecord(req, res, mqttClient, 3)
  })

  app.get("/escape/fail", function(req, res) {
    //For mission fail
    return setMissionRecord(req, res, mqttClient, 4)
  })

  app.get("/escape/start", function(req, res) {
    //For pass next mission
    return setMissionStart(req, res, mqttClient)
  })

  app.get("/escape/status", function(req, res) {
    return getStatus(req, res)
  })

  app.get("/escape/data", function(req, res) {
    return getData(req, res)
  })


  app.get("/escape/error", function(req, res) {
    let data = errorObj
    resResources.getDtaSuccess(res, data)
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
  try {
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
  } catch (error) {
    resResources.catchError(res, error.message)
  }
}

async function sendControl(req, res, mqttClient) {
  try {
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
  } catch (error) {
    resResources.catchError(res, error.message)
  }
}

function decode_base64(str) {
  return new Buffer(str, 'base64').toString()
}

async function setMissionAction(req, res, mClient) {
  try {
    //let topic = mqttConfig.dlRoomTopic//Escape dl topic
    let nTime = new Date().toISOString()
    console.log(nTime+' setMissionAction -------------------');
    actionCount++;
    let redisClient = new redisHandler(0)
    redisClient.connect()
    
    let user_id = req.body.user_id || req.query.user_id
    let room_id = req.body.room_id || req.query.room_id
    if(user_id === undefined || room_id === undefined)
        return resResources.missPara(res)
    //Set default action
    if(action === undefined || action === null) {
      action = {}
    }
    if(action[room_id] === undefined || action[room_id] === null) {
      action[room_id] = {}
    }

    if(action[room_id]['status'] === 1){
      return resResources.notAllowed(res, 'Already acted')
    }
    
    
    let idList = []
    let roomKey = 'room'+room_id
    
    console.log(new Date().toISOString()+' before get teamUser for team_id ----------')
    let teamUser = await dataResources.getTeamUser(user_id)
    console.log(new Date().toISOString()+' after get teamUser for team_id ')
    if(teamUser === null) 
        return resResources.notAllowed(res, 'Not join team')
    console.log(new Date().toISOString()+' before get teamUser for members ----------')
    let teamUsers = await dataResources.getTeamUsers(teamUser.team_id)
    console.log(new Date().toISOString()+' after get teamUser for members')
    //Get room
    let room = null
    if(roomObj[room_id] === undefined || typeof(roomObj[room_id]) != 'object') {
      console.log(new Date().toISOString()+' before get room ----------')
      room = await dataResources.getRoom(room_id)
      console.log(new Date().toISOString()+' after get room')
      
      if(room === null ) 
        return resResources.notFound(res, 'Not found room')
      roomObj[room_id] = JSON.parse(JSON.stringify(room))
    } else {
      room = JSON.parse(JSON.stringify(roomObj[room_id]))
    }
    let clean = await redisClient.flush()
    
    hsetValue(redisClient, roomKey, 'start', nTime)
    hsetValue(redisClient, roomKey, 'sequence', 1)
    hsetValue(redisClient, roomKey, 'room_name', room.room_name)
    hsetValue(redisClient, roomKey, 'pass_time', room.pass_time)
    hsetValue(redisClient, roomKey, 'team_id', teamUser.team_id)
    action[room_id]['status'] = 1
    action[room_id]['sequence'] = 1
    action[room_id]['start'] = nTime
    action[room_id]['pass_time'] = room.pass_time
    action[room_id]['team_id'] = teamUser.team_id

    //Get all of missions of room
    if(missionObj[room_id] === undefined || typeof(missionObj[room_id]) != 'object') {
      console.log(new Date().toISOString()+' before get mission ----------')
      let mList = await dataResources.getMissions(room_id)
      console.log(new Date().toISOString()+' after get mission')
      if(mList === null || mList.length === 0 ) 
        return resResources.notFound(res, 'Not found mission')

      missionObj[room_id] = []
      let index = 0
      for(let i=0;i<mList.length;i++) {
        let item = JSON.parse(JSON.stringify(mList[i]))
        if( item.sequence != null) {
          missionObj[room_id].splice( index, 0, item );
          index++
        }
      }
    } 
    
    
    //Get all of scripts of room
    let script = null
    if(scriptObj[room_id] === undefined || typeof(scriptObj[room_id]) != 'object') {
      console.log(new Date().toISOString()+' before get scripts ----------')
      let allList = await dataResources.getScripts(room_id)
      console.log(new Date().toISOString()+' after get scripts')
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
    let missions = JSON.parse(JSON.stringify(missionObj[room_id]))
    let scripts = JSON.parse(JSON.stringify(scriptObj[room_id]))
    
    //console.log(typeof room)
    //console.log(typeof missions)
    //console.log(typeof scripts)
    
    //Get all of user id in team
    for(let i=0;i<teamUsers.length;i++) {
      let item = teamUsers[i]
        idList.push(item.user_id)
    }
    let member = JSON.stringify(idList)
    hsetValue(redisClient, roomKey, 'members', member)
    action[room_id]['members'] = member
    
    let mStr = ''
    for(let i=0;i<missions.length;i++) {

      let mission = missions[i]
      let mac = mission.macAddr
      //Filter emergency mac of room 
      if(mission.sequence != 0) {//Mission 0 for emergency
        //redisClient.hsetValue(roomKey, mission.sequence, mac)
        mStr = mStr + mission.macAddr + ','
      } 

      hsetValue(redisClient, mac, 'room_id', room_id)
      hsetValue(redisClient, mac, 'sequence', mission.sequence)
      hsetValue(redisClient, mac, 'mission_id', mission.id)
      
      //Jason add for set mission_id to room in redis
      if(mission.sequence == 1) {//First mission
        hsetValue(redisClient, roomKey, 'mission_id', mission.id)
      }

      //Filter sequence 0 -> for emergency no script
      if(mission.sequence == 0)
        continue
      actionScript[mission.id] = getScript(scripts[mission.id])
    }
    mStr = mStr.substring(0,mStr.length-1);
    let arr = mStr.split(',')
    hsetValue(redisClient, roomKey, 'count', arr.length)
    hsetValue(redisClient, roomKey, 'macs', mStr)
    action[room_id]['count'] = arr.length
    action[room_id]['macs'] = mStr
    file.saveJsonToFile(roomPath,action)
    let target = null
    
    //Set script to mission
    for(let i=0;i<missions.length;i++) {
      let mission = missions[i]
      
      if(mission.sequence === 0)
          continue
      let mac = mission.macAddr
      mission['script'] = actionScript[mission.id]
      if(mission.sequence === 1) {
        target = mac
        save2SendSocket(mClient, target, 1, nTime)
      }
      //Send pass of script to node by MQTT
      if(mac != undefined && mission.sequence != 0  && mission.script != null) {
        
        if(typeof mission.script.pass === 'string') {
          mission.script.pass = JSON.parse(mission.script.pass)
        }
        let topic = 'YESIO/DL/'+mac
        let message = JSON.stringify({"macAddr": mac, "pass": mission.script.pass})
        mClient.sendMessage(topic, message)
      }
    }
    file.saveJsonToFile(missionPath, missions)
    
    let data = {"room":room, "ids":idList, "missions":missions }
    return resResources.getDtaSuccess(res, data)
  } catch (error) {
    resResources.catchError(res, error.message)
  }
}

async function setMissionRecord(req, res, mClient, status) {
  try {
    //Get room key
    let mytime = new Date().toISOString()
    console.log(mytime+' setMissionStop -------------------')
    let test = null
    let redisClient = new redisHandler(0)
    redisClient.connect()
    let room_id = req.body.room_id || req.query.room_id
    console.log('room_id :'+room_id)
    if(room_id === undefined) {
      console.log('????? missPara room_id')
      //errorObj.push(mytime+'-missPara room_id')
      return resResources.missPara(res)
    }
    
    if(action[room_id] === undefined || action[room_id] === null) {
      return resResources.notAllowed(res,'No action')
    }
    console.log('action[room_id][status] :'+ action[room_id]['status'])
    if(action[room_id]['status'] !=1) {
      //errorObj.push(mytime+' - action[room_id][status] !=1')
      console.log('????? action[room_id][status] !=1 -> notAllowed')
      return resResources.notAllowed(res,('status:'+action[room_id]['status']))
    }
    let roomKey = 'room'+room_id
    console.log('roomKey:'+roomKey)
    
    
    //Get sequence
    let sequence
    
    sequence = await redisClient.hgetValue(roomKey, 'sequence')
    console.log('sequence :'+sequence)
    if(sequence === null) {
      action = file.getJsonFromFile(roomPath)
      sequence = action[room_id]['sequence']
    }
    if(sequence === null) {
      //errorObj.push(mytime+' - sequence null')
      console.log('????? sequence from redis (room)is null ')
      sequence = 1;
    }
    
    let index = parseInt(sequence) - 1
    let str = await redisClient.hgetValue(roomKey, 'macs')
    console.log('macs:'+str)
    if(str === null) {
      action = file.getJsonFromFile(roomPath)
      str = action[room_id]['macs']
    }
    if(str === null) {
      //errorObj.push(mytime+' - macs null')
      console.log('????? macs from redis (room) is null ')
      return resResources.notAllowed(res, 'No action yet')
    }
    //Set status
    action[room_id]['status'] = status
    file.saveJsonToFile(roomPath, action)
    let arr = str.split(',')
    let mac = arr[index] 
    
    //Set end time to redis
    //test = await redisClient.hsetValue(mac, 'end', mytime)
    hsetValue(redisClient, mac, 'end', mytime)
    //test = await redisClient.hsetValue(roomKey, 'end', mytime)
    hsetValue(redisClient, roomKey, 'end', mytime)
    //Save report and snd socket to web
    save2SendSocket(mClient, mac, status, mytime)
    //Save record for mission in setMissionRecord
    if(isTest === false) {
      let result = await saveRecord(redisClient, room_id, mac)
      if(result.id)
        rCount++;
      let result2 = await saveTeamRecord(redisClient, room_id, mac, status)
      if(result2.id)
        trCount++;

      console.log('actionCount'+actionCount+',rCount :'+rCount + ', trCount :'+trCount)
    }
    let message = 'Stop the mission'
    if(status === 3) {
      message = 'Pass the mission'
    } else if(status === 4){
      message = 'Fail the mission'
    } else {
      message = 'Stop the mission'
    }

    return resResources.doSuccess(res, message)
  } catch (error) {
    resResources.catchError(res, error.message)
  }
}

async function getData(req, res) {
  try {
    //let topic = mqttConfig.dlRoomTopic//Escape dl topic
    let nTime = new Date().toISOString()
    console.log(nTime+' setMissionAction -------------------');
    actionCount++;
    let redisClient = new redisHandler(0)
    redisClient.connect()
    let user_id = req.body.user_id || req.query.user_id
    let room_id = req.body.room_id || req.query.room_id
    if(user_id === undefined || room_id === undefined)
        return resResources.missPara(res)
    let roomKey = 'room'+room_id
    let str = await redisClient.hgetValue(roomKey, 'members')
    
    if(str === null) {
      str = action[room_id]['members']
    }
    if(str === null) {
      action = file.getJsonFromFile(roomPath)
      str = action[room_id]['members']
    }
    let members = JSON.parse(str)
    user_id = parseInt(user_id)
    //console.log(members.indexOf(user_id))
    if(members.indexOf(user_id) < 0) {
      return resResources.notAllowed(res)
    }
    let room = null
    if(roomObj && roomObj[room_id]) {
      room = roomObj[room_id]
    } else {
      room = await dataResources.getRoom(room_id)
    }
    
    let missions = file.getJsonFromFile(missionPath)
      
    let data = {"room":room, "ids":members, "missions":missions }
    return resResources.getDtaSuccess(res, data)
  } catch (error) {
    resResources.catchError(res, error.message)
  }
}

function getDiff(start_time, end_tme) {
  let new1 = Date.parse(start_time)
  let new2 = Date.parse(end_tme)
  //最小整數
  //let timestamp = Math.ceil((new2-new1)/1000)
  //Math.floor() 最大整數
  let timestamp = Math.floor((new2-new1)/1000)
  return timestamp
}

async function setMissionStart(req, res, mClient) {
  try {
    let newtime = new Date().toISOString()
    console.log(newtime + ' setMissionStart -------------------')
    let redisClient = new redisHandler(0);
    redisClient.connect();
    let room_id = req.body.room_id || req.query.room_id
    let sequence = req.body.sequence || req.query.sequence

    if(room_id === undefined || sequence === null) 
        return resResources.missPara(res)
    if(action[room_id] === undefined || action[room_id] === null || action[room_id]['status'] != 1) {
      return resResources.notAllowed(res, 'No action')
    }
    let roomKey = 'room'+room_id
    console.log('roomKey :'+roomKey +', sequence:'+sequence)
    let count = await redisClient.hgetValue(roomKey, 'count')
    console.log('From redis count :')
    console.log(count)
    if(count === null) {
      action = file.getJsonFromFile(roomPath)
      count = action[room_id]['count']
    }

    if(count === null) {
      //errorObj.push(newtime + ' - count null')
      console.log('????? macs from redis (room) is null ')
      return resResources.notAllowed(res, 'No action yet')
    }

    sequence = parseInt(sequence)
    count = parseInt(count)
   
    if(sequence > count) {
      console.log('sequence > count -> Not found sequence')
      //errorObj.push(newtime + ' - sequence > count')
      return resResources.notFound(res, 'Not found sequence')
    }  
     
    if(sequence < 2) {
      console.log('sequence < 2 -> Sequence is less then 2')
      //errorObj.push(newtime + ' - sequence < 2')
      return resResources.notAllowed(res, 'Sequence is less then 2')
    }
      
    
    let index = sequence - 1 
    let str = await redisClient.hgetValue(roomKey, 'macs')
    if(str === null) {
      let json = file.getJsonFromFile(roomPath)
      str = json[room_id]['macs']
    }
    if(str === null) {
      console.log('macs from redis is null')
      return resResources.notAllowed(res)
    }
    let arr = str.split(',')
    let mac2 = arr[index]
    let mac1 = arr[index-1]
    
    //Jason add for set mission_id to room in redis
    save2SendSocket(mClient, mac1, 2, newtime)
    
    let currentMission = await redisClient.hgetValue(mac2, 'mission_id')
    
    hsetValue(redisClient, roomKey, 'mission_id', currentMission)
    hsetValue(redisClient, roomKey, 'sequence', sequence)
    hsetValue(redisClient, mac1, 'end', newtime)
    hsetValue(redisClient, mac2, 'start', newtime)

    action[room_id]['sequence'] = sequence
    file.saveJsonToFile(roomPath, action)
    
    console.log('mac2 :'+ mac2)
    console.log('mission_id from mac2:'+currentMission)
    save2SendSocket(mClient, mac2, 1, newtime)
    //Save record for mission in setMissionStart
    if(isTest === false) {
      let check = await saveRecord(redisClient, room_id, mac1)
      if(check && check.id) 
        rCount++;
      /*console.log('--------- saveRecord-------- '+ new Date().toISOString())
      console.log('id:'+check.id+', mission_id: '+ check.mission_id)*/
    }
    
    return resResources.doSuccess(res, 'Start mission OK')
  } catch (error) {
    resResources.catchError(res, error.message)
  }
}

async function getStatus(req, res) {
  try {
    let room_id = req.body.room_id || req.query.room_id
    let roomKey = 'room'+room_id
    
    let redisClient = new redisHandler(0);
    redisClient.connect();

    if(action[room_id] === undefined || action[room_id]['status'] === undefined) {
      action = file.getJsonFromFile(roomPath)
    }
    let status = action[room_id]['status']
    let countdown = 0
    let sequence = 0
    if( status === 1) {//During in pass mission
      let start = await redisClient.hgetValue(roomKey, 'start')
      let pass_time = await redisClient.hgetValue(roomKey, 'pass_time')
      sequence = await redisClient.hgetValue(roomKey, 'sequence')
      
      if(start === null ) {
        action = file.getJsonFromFile(roomPath)
        start = action[room_id]['start']
      }
      if(pass_time === null ) {
        action = file.getJsonFromFile(roomPath)
        pass_time = action[room_id]['pass_time']
      }
      if(sequence === null ) {
        action = file.getJsonFromFile(roomPath)
        sequence = action[room_id]['sequence']
      }
      pass_time = parseInt(pass_time) 
      sequence = parseInt(sequence)
      let now = new Date().toISOString()
      let diff = getDiff(start, now)
      countdown = pass_time - diff
      countdown = 0

      if(countdown <= 0) {
        action[room_id]['status'] = 4
        countdown = 0
      }
    } 
    let data = {"countdown":countdown, "status": action[room_id]['status'], "sequence":sequence}
    return resResources.getDtaSuccess(res, data)
  } catch (error) {
    resResources.catchError(res, error.message)
  }
}

async function saveRecord(client, id, mac) {
  let myKey = 'room'+id
  let team_id = await client.hgetValue(myKey, 'team_id')
  let mission_id = await client.hgetValue(mac, 'mission_id')
  let start = await client.hgetValue(mac, 'start')
  let end = await client.hgetValue(mac, 'end')
  let diff = getDiff(start, end)
  let saveObj = {
    "team_id": team_id,
    "room_id": id,
    "mission_id": mission_id,
    "start": start,
    "end": end,
    "time": diff
  }
  return dataResources.createRecord(saveObj)
}

async function saveTeamRecord(client, id, mac, status) {
  let myKey = 'room'+id
  let team_id = await client.hgetValue(myKey, 'team_id')
  let team = await client.dataResources.getTeam(team_id)
  let start = await client.hgetValue(myKey, 'start')
  let end = await client.hgetValue(myKey, 'end')
  let diff = getDiff(start, end)
  let score = 0
  let mission_id = await client.hgetValue(myKey, 'mission_id')
  if(status == 3)
    score = 1
  let saveObj = {
    "team_id": team_id,
    "room_id": id,
    "cp_id": team.cp_id,
    "total_time": diff,
    "total_score": score,
    "status" : status,
    "mission_id": mission_id
  }
  return dataResources.createTeamRecord(saveObj)
}

function getScript(list) {
  //console.log(list)
  if(list === undefined) {
    return null
  }
  let num = getRandom(list.length)

  //console.log('getScript number = ',num)
  return JSON.parse(JSON.stringify(list[num]))
}

function getRandom(x){
  return Math.floor(Math.random()*x);
};

/*function hsetValue(key, fieids, value) {
  let redisClient = new redisHandler(0);
  redisClient.connect();
  redisClient.hsetValue(key, fieids, value);
}*/

async function hsetValue(client, key, fieids, value) {
  let num = 0
  let myResult
  while(myResult !=1 && num <3) {
    myResult = await client.hsetValue(key, fieids, value)
    num++
  }
  return myResult
}

function remove(key, field) {
  let redisClient = new redisHandler(0);
  redisClient.connect();
  return redisClient.remove(key, field);
}

async function save2SendSocket(client, mac, status, time) {
  let newTime = new Date().toISOString()
  let msg = {"macAddr":mac,"data":{"key1":status},"fport":99, "recv":time}
  let mobj = client.adjustObj(msg)
  client.sendSocket(mobj)
  let check = await client.saveMessage(mobj)
  console.log('******************'+ newTime)
  console.log('id:'+check.id+', mac: '+ mac + ', status: '+ check.key1)
  return check
} 


