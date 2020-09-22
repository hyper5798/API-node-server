
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
let mObj = {}
let sObj = {}
let actionScript = {}
let action = {}
let trCount = 0
let rCount = 0
let actionCount = 0
let errorObj = []
let roomPath = './config/room.json';
let missionPath = './config/mission.json';
let actionPath = './config/action.json';
let errorPath = './config/error.txt';
let logPath = './config/log.txt';
let memberObj = {}

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
  init()
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
    showLog('setMissionStop -------------------')
    return setMissionStop(req, res, mqttClient, 6)
  })

  app.get("/escape/pass", function(req, res) {
    showLog('setMissionPass -------------------')
    return setMissionStop(req, res, mqttClient, 3)
  })

  app.get("/escape/fail", function(req, res) {
    //For mission fail
    showLog('setMissionFail -------------------')
    return setMissionStop(req, res, mqttClient, 4)
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

  //If isTest is false to check token
  if(!isTest) {
    //Set token check middleware
    app.use(setCurrentUser)
  }
    
  
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
      if(cmd == null) {
        showError('404 not found command')
        return resResources.notFound(res)
      }
        
      let message = JSON.stringify({"macAddr": macAddr, "cmd": cmd})
      mqttClient.sendMessage(topic, message);
      return resResources.doSuccess(res, "Message sent to mqtt")
    }
    else {
      showError('404 not found Commands')
      return resResources.notFound(res)
    }
      
  } catch (error) {
    showError(error.message)
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
      if(cmd == null) {
        showError('404 no found command')
        return resResources.notFound(res)
      }
        
      let message = JSON.stringify({"macAddr": arr[0], "cmd": cmd})
      mqttClient.sendMessage(topic, message);
      return resResources.doSuccess(res, "Control sent to mqtt")
    }
    else {
      showError('404 no found command')
      return resResources.notFound(res)
    }
      
  } catch (error) {
    showError(error.message)
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
    
    let user_id = req.body.user_id || req.query.user_id
    let room_id = req.body.room_id || req.query.room_id
    if(user_id === undefined || room_id === undefined) {
      showError('setMissionAction miss param ')
      return resResources.missPara(res)
    }
        
    //Set default action
    if(action === undefined || action === null) {
      action = {}
    }
    if(action[room_id] === undefined || action[room_id] === null) {
      action[room_id] = {}
    }

    if(action[room_id]['status'] === 1){
      showError('setMissionAction status = 1 -> 405 Already acted')
      return resResources.notAllowed(res, 'Already acted')
    }
    
    let roomKey = 'room'+room_id
    //Get members and team_id
    //if(memberObj[room_id] === undefined || memberObj[room_id] === null ) {
      showLog('1.Before get members')
      const obj = await dataResources.getMembers(user_id)
      showLog('1.After get members')
      if(obj === null) {
        showError('setMissionAction members is null -> 405 Not join team')
        return resResources.notAllowed(res, 'Not join team')
      }
      // memberObj[room_id] = obj
      let teamId = obj.team_id
      let members = obj.members
      showLog('team_id :'+teamId)
      console.log(members)
    /*} 
    
    if(action[room_id]['team_id'] === undefined || action[room_id]['team_id'] === null) {
      action = file.getJsonFromFile(actionPath)
    }*/

    
    user_id = parseInt(user_id)
    if(members.indexOf(user_id) < 0) {
      showError('setMissionAction 405 Not join team')
      return resResources.notAllowed(res, 'Not join team')
    }
    
    //Get room
    let room = null
    if(roomObj[room_id] === undefined || roomObj[room_id] === null) {
      showLog('2.Before get room')
      room = await dataResources.getRoom(room_id)
      showLog('2.After get room')
      roomObj[room_id] = room
    } else {
      room = roomObj[room_id]
    }
    if(room === null ) {
      showError('setMissionAction 404 Not found room')
      return resResources.notFound(res, 'Not found room')
    }

    //Get all of missions of room
    if(mObj[room_id] === undefined || typeof(mObj[room_id]) != 'object') {
      showLog('3. Before get mission')
      let mList = await dataResources.getMissions(room_id)
      showLog('3. After get mission')
      if(mList === null || mList.length === 0 ) {
        showError('setMissionAction 404 Not found mission')
        return resResources.notFound(res, 'Not found mission')
      }
        
      mObj[room_id] = mList
    } 
    
    //Get all of scripts of room
    if( sObj[room_id] === undefined) {
      showLog('4. Before get getGroupScript')
      sObj[room_id] = await dataResources.getGroupScript(room_id)
      showLog('4. After get getGroupScript')
      if(sObj[room_id] === null || sObj[room_id].length === 0 ) {
        showError('setMissionAction 404 Not found script')
        return resResources.notFound(res, 'Not found script')
      }
    }
    const scripts = sObj[room_id]
    let missions = mObj[room_id]
    let redisClient = new redisHandler(0)
    redisClient.connect()
    let clean = await redisClient.flush()
    
    if(isTest) {
      console.log('*** Show room, missions and scripts ----------------------------------------------')
      console.log(room.room_name)
      console.log('missions.length : '+missions.length)
      console.log('scripts.length : '+ Object.keys(scripts).length)
    }
       
    action[room_id]['status'] = 1
    action[room_id]['sequence'] = 1
    action[room_id]['room_name'] = room.room_name
    action[room_id]['start'] = nTime
    action[room_id]['pass_time'] = room.pass_time
    action[room_id]['team_id'] = teamId
    action[room_id]['members'] = members

    //redis field unable save object
    hsetValue(redisClient, roomKey, 'start', nTime)
    hsetValue(redisClient, roomKey, 'status', 1)
    hsetValue(redisClient, roomKey, 'sequence', 1)
    hsetValue(redisClient, roomKey, 'room_name', room.room_name)
    hsetValue(redisClient, roomKey, 'pass_time', room.pass_time)
    hsetValue(redisClient, roomKey, 'team_id', teamId)
    hsetValue(redisClient, roomKey, 'members', JSON.stringify(members))

    //Save mission with mac to redis
    let mStr = ''
    for(let i=0;i<missions.length;i++) {

      let mission = missions[i]
      let mac = mission.macAddr
      //Filter emergency mac of room 
      if(mission.sequence === null || mission.sequence === 0) {//Mission 0 for emergency
        continue
      } 
      mStr = mStr + mission.macAddr + ','

      hsetValue(redisClient, mac, 'room_id', room_id)
      hsetValue(redisClient, mac, 'sequence', mission.sequence)
      hsetValue(redisClient, mac, 'mission_id', mission.id)
      
      //Jason add for set mission_id to room in redis
      if(mission.sequence == 1) {//First mission
        hsetValue(redisClient, roomKey, 'mission_id', mission.id)
        hsetValue(redisClient, mac, 'start', nTime)
      }
      actionScript[mission.id] = getScript(scripts[mission.id])
    }

    mStr = mStr.substring(0,mStr.length-1);
    let arr = mStr.split(',')
    hsetValue(redisClient, roomKey, 'count', arr.length)
    hsetValue(redisClient, roomKey, 'macs', mStr)
    redisClient.quit()
    action[room_id]['count'] = arr.length
    action[room_id]['macs'] = mStr
    file.saveJsonToFile(actionPath,action)
    let target = null
    let list = JSON.parse(JSON.stringify(missions))
    let lists = []

    //Model can't add field so add list and list to push mission with script
    //Set script to mission
    for(let i=0;i<list.length;i++) {
      let mission = list[i]
      
      if(mission.sequence === 0)
          continue
      let mac = mission.macAddr
      
      mission['script'] = actionScript[mission.id]
      lists.push(mission)
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
          //mClient.sendMessage(topic, message)
          sendMQTTMessage(mClient, topic, message, (i+1)*500)
      }
    }
    //For getData API to get missions with script
    file.saveJsonToFile(missionPath, lists)
    
    let data = {"room":room, "members":members, "missions":lists }
    //console.log('------------------------------------------------------------------------')
    //console.log(list)
    return resResources.getDtaSuccess(res, data)
  } catch (error) {
    showError('setMissionAction '+error.message)
    resResources.catchError(res, error.message)
  }
}

//Send mqtt with delay time
const sendMQTTMessage = (client , topic, message, time ) => {
  return new Promise((resolve, reject) => {
      if (message) {
          setTimeout(() => {
              client.sendMessage(topic, message);
              resolve()
          }, time);
      } else {
          reject();
      }
  });
};

async function setMissionStop(req, res, mClient, status) {
  try {
    //Get room key
    let mytime = new Date().toISOString()
    let test = null
    let room_id = req.body.room_id || req.query.room_id
    
    if(room_id === undefined) {
      showError('setMissionStop missPara room_id')
      return resResources.missPara(res)
    }
    
    if(action[room_id] === undefined || action[room_id] === null) {
      showError('setMissionStop No action')
      return resResources.notAllowed(res,'action[room_id] === undefined -> 405')
    }
    showLog('action[room_id][status] :'+ action[room_id]['status'])
    if(action[room_id]['status'] !=1) {
      showError('setMissionStop status !=1 -> 405')
      return resResources.notAllowed(res,('status:'+action[room_id]['status']))
    }
    let redisClient = new redisHandler(0)
    redisClient.connect()
    let roomKey = 'room'+room_id
    showLog('roomKey:'+roomKey)
    
    
    //Get sequence
    let sequence
    
    sequence = await redisClient.hgetValue(roomKey, 'sequence')
    showLog('sequence :'+sequence)
    if(sequence === null) {
      showLog('???? sequence from redis is null ')
      action = file.getJsonFromFile(actionPath)
      sequence = action[room_id]['sequence']
    }
    if(sequence === null) {
      showLog('???? sequence from file is null ')
      sequence = 1;
    }
    
    let index = parseInt(sequence) - 1
    let str = await redisClient.hgetValue(roomKey, 'macs')
    
    if(str === null) {
      showLog('???? Macs from redis is null')
      action = file.getJsonFromFile(actionPath)
      str = action[room_id]['macs']
    }
    if(str === null) {
      showError('setMissionStop macs null -> 405 No action yet')
      return resResources.notAllowed(res, 'No action yet')
    }
    //Set status
    action[room_id]['status'] = status
    file.saveJsonToFile(actionPath, action)
    let arr = str.split(',')
    let mac = arr[index] 
    showLog('macs : '+str )
    showLog('Change action[room_id][status] :'+ action[room_id]['status'])
    
    //Set end time to redis
    hsetValue(redisClient, mac, 'end', mytime)
    hsetValue(redisClient, roomKey, 'end', mytime)
    hsetValue(redisClient, roomKey, 'status', status)
    //Save report and snd socket to web
    save2SendSocket(mClient, mac, status, mytime)
    //Save record for mission in setMissionStop
    if(isTest === false) {
      let result = await saveRecord(redisClient, room_id, mac)
      if(result.id)
        rCount++;
      let result2 = await saveTeamRecord(redisClient, room_id, mac, status)
      if(result2.id)
        trCount++;

      showLog('actionCount'+actionCount+',rCount :'+rCount + ', trCount :'+trCount)
    }
    redisClient.quit()
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
    showError('setMissionStop '+error.message)
    resResources.catchError(res, error.message)
  }
}

async function getData(req, res) {
  try {
    //let topic = mqttConfig.dlRoomTopic//Escape dl topic
    let nTime = new Date().toISOString()
    console.log(nTime+' getData -------------------');
    actionCount++;
    
    let user_id = req.body.user_id || req.query.user_id
    let room_id = req.body.room_id || req.query.room_id
    if(user_id === undefined || room_id === undefined) {
      showError('getData 400 missPara')
      return resResources.missPara(res)
    }
        
    let roomKey = 'room'+room_id
    let members = null
    let redisClient = new redisHandler(0)
    redisClient.connect()
    let str = await redisClient.hgetValue(roomKey, 'members')
    redisClient.quit()
    if(str === null) {
      members = action[room_id]['members']
    } else {
      members = JSON.parse(str)
    }
    //Memory issue
    if(members === null) {
      action = file.getJsonFromFile(actionPath)
      members = action[room_id]['members']
    }
    user_id = parseInt(user_id)
    //console.log(members.indexOf(user_id))
    if(members.indexOf(user_id) < 0) {
      showError('getData 405 No join team')
      return resResources.notAllowed(res,'No join team')
    }
    let room = null
    if(roomObj && roomObj[room_id]) {
      room = roomObj[room_id]
    } else {
      room = await dataResources.getRoom(room_id)
    }
    
    let missions = file.getJsonFromFile(missionPath)
      
    let data = {"room":room, "members":members, "missions":missions }
    return resResources.getDtaSuccess(res, data)
  } catch (error) {
    showError('getData '+error.message)
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
    showLog('setMissionStart -------------------')
    
    let room_id = req.body.room_id || req.query.room_id
    let sequence = req.body.sequence || req.query.sequence

    if(room_id === undefined || sequence === null) {
      showError('setMissionStart 400 -> missPara')
      return resResources.missPara(res)
    }
        
    if(action[room_id] === undefined || action[room_id] === null || action[room_id]['status'] != 1) {
      showError('setMissionStart action[room_id] is null -> 405')
      return resResources.notAllowed(res, 'No action')
    }
    let roomKey = 'room'+room_id
    showLog('roomKey :'+roomKey +', sequence:'+sequence)
    let redisClient = new redisHandler(0);
    redisClient.connect();
    let count = await redisClient.hgetValue(roomKey, 'count')
    let currentSequence = await redisClient.hgetValue(roomKey, 'sequence')
    if(currentSequence === null) {
      showError('setMissionStart redis sequence null')
      action = file.getJsonFromFile(actionPath)
      currentSequence = action[room_id]['sequence']
    }

    if(count === null) {
      showLog('From redis count is null')
      action = file.getJsonFromFile(actionPath)
      count = action[room_id]['count']
    } 
    
    if(count === null) {
      showError('setMissionStart count from file null -> 405 No action yet')
      return resResources.notAllowed(res, 'No action yet')
    }
    currentSequence = parseInt(currentSequence)
    sequence = parseInt(sequence)
    count = parseInt(count)
    showLog('count : '+count+ ', sequence : '+sequence + ', currentSequence:'+currentSequence)
   
    if(currentSequence === sequence) {
      showError('setMissionStart 404 repeat sequence '+sequence)
      return resResources.notAllowed(res, 'Repeat sequence '+sequence)
    }


    if(sequence > count) {
      showError('setMissionStart 404 Not found sequence '+ sequence)
      return resResources.notFound(res, 'Not found sequence'+ sequence)
    }  
     
    if(sequence < 2) {
      showError('setMissionStart 405 Sequence < 2')
      return resResources.notAllowed(res, 'Sequence is less then 2')
    }
  
    
    let index = sequence - 1 
    let str = await redisClient.hgetValue(roomKey, 'macs')
    if(str === null) {
      let json = file.getJsonFromFile(actionPath)
      str = json[room_id]['macs']
    }
    if(str === null) {
      showError('setMissionStart macs from file null -> 405 No allow')
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
    redisClient.quit()
    action[room_id]['sequence'] = sequence
    file.saveJsonToFile(actionPath, action)
    
    showLog('mission_id: '+currentMission+', mac2 :'+ mac2)
    let newtime2 = new Date().toISOString()
    save2SendSocket(mClient, mac2, 1, newtime2)
    
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
    showError(error.message)
    resResources.catchError('setMissionStart' + res, error.message)
  }
}

async function getStatus(req, res) {
  try {
    let room_id = req.body.room_id || req.query.room_id
    if(room_id === undefined) {
      showError('getStatus 400 missPara')
      return resResources.missPara(res)
    }
    let roomKey = 'room'+room_id

    if(action[room_id] === undefined || action[room_id]['status'] === undefined) {
      action = file.getJsonFromFile(actionPath)
    }
    let status = action[room_id]['status']
    let countdown = 0
    let sequence = 0
    if( status === 1) {//During in pass mission

      let redisClient = new redisHandler(0);
      redisClient.connect()
      let start = await redisClient.hgetValue(roomKey, 'start')
      let pass_time = await redisClient.hgetValue(roomKey, 'pass_time')
      sequence = await redisClient.hgetValue(roomKey, 'sequence')
      redisClient.quit()

      if(start === null ) {
        action = file.getJsonFromFile(actionPath)
        start = action[room_id]['start']
      }
      if(pass_time === null ) {
        action = file.getJsonFromFile(actionPath)
        pass_time = action[room_id]['pass_time']
      }
      if(sequence === null ) {
        action = file.getJsonFromFile(actionPath)
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
    showError('getStatus '+error.message)
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

function hsetValue(client, key, fieids, value) {
  client.hsetValue(key, fieids, value);
}

/*async function hsetValue(client, key, fieids, value) {
  let num = 0
  let myResult
  while(myResult !=1 && num <3) {
    myResult = await client.hsetValue(key, fieids, value)
    num++
  }
  return myResult
}*/

function remove(key, field) {
  let redisClient = new redisHandler(0);
  redisClient.connect();
  return redisClient.remove(key, field);
}

function save2SendSocket(client, mac, status, time) {
  //let newTime = new Date().toISOString()
  let msg = {"macAddr":mac,"data":{"key1":status},"fport":99, "recv":time}
  let mobj = client.adjustObj(msg)
  client.sendSocket(mobj)
 
  //let check = await client.saveMqttMessage(mobj)
  client.saveMqttMessage(mobj)
  
  //console.log('******************'+ newTime)
  //console.log('id:'+check.id+', mac: '+ mac + ', status: '+ check.key1)
  //return check
} 

function showLog(message) {
  if(isTest)
    console.log(message + ' '+ new Date().toISOString())
    //file.appendToFile(logPath, message)
}

function showError(message) {
  if(isTest)
    //console.log(message + ' '+ new Date().toISOString())
    file.appendToFile(errorPath, message)
}

function init() {
  file.saveToFile(errorPath, 'Debug start')
}