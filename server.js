
'use strict'

/*!
 * Module dependencies
 */
const isTest = true
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
const file = require('./modules/fileTools')
let errorPath = './doc/log/error.txt';


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
  //init()
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

  app.get("/escape/error", function(req, res) {
    let data = file.getFromFile(errorPath)
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
  app.use('/escape', require('./routes/escapeRoute'))
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
      if(typeof data === 'string') {
        mqttClient.checkWSConnect()
      } else {
        if(data.hasOwnProperty('mode')){
          //Change mode
          socket.broadcast.emit('change_mode', data)
        }
      }
      
    });//send_switch_command

    socket.on('mqtt_sub', function (data) {
      showLog('## Send socket to web')
      console.log(data)
      //console.log( data)
      socket.broadcast.emit('update_command_status', data)
    });

    socket.on('mqtt_command', function (data) {
      
      console.log(data);
      let topic = 'YESIO/DL/'+data.macAddr
      showLog('## Send mqtt topic :'+topic)
      if(data && typeof data === 'object')
        data = JSON.stringify(data)
      showLog('## Send mqtt message :'+data)
      mqttClient.sendMessage(topic, data)
    });

    socket.on('socket_command', function (data) {
      
      console.log(data);
      if(data && typeof data === 'object')
        data = JSON.stringify(data)
      showLog('## Send socket message :'+data)
      socket.broadcast.emit('update_command_status', data)
    });


    socket.on('reply_command_status', function (data) {
      console.log('reply_command_status' + JSON.stringify(data)) 
      socket.broadcast.emit('update_command_status', data)
    });

    socket.on('MQTT_YESIO_UL', function (data) {
      console.log('server receive MQTT_YESIO_UL' + JSON.stringify(data)) 
      io.sockets.emit('update_mqtt_ul', data)
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


function showLog(message) {
  if(isTest)
    //console.log(message + ' >>> '+ new Date().toISOString())
    console.log( new Date().toISOString()+ ' >>> '+ message)
    //file.appendToFile(logPath, message)
}

function showError(message) {
  if(isTest)
    //console.log(message + ' '+ new Date().toISOString())
    file.appendToFile(errorPath, message)
}

async function init() {
  const redisHandler  = require('./modules/redisHandler')
  const roomPath = './doc/room/room';
  const dataResources = require('./lib/dataResources')
  let rooms = await dataResources.getRooms()
  let tmp = {}
  for(let i=0;i<rooms.length;i++) {
    let path = roomPath+rooms[i].id+'.json'
    file.saveJsonToFile(path,tmp)
  }
  file.saveToFile(errorPath, 'Debug start')
}
