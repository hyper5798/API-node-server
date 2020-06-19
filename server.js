
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
const debug = false
global.debug = debug
let mqttHandler = require('./modules/mqttHandler')
const userController = require('./controllers/userController')
const setCurrentUser = require('./middleware/setCurrentUser.js')
const appConfig = require('./config/app.json')



//Jason add on 2020.02.16 - start
const RED = require("node-red")

const setting = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/",
    userDir:"./.nodered/",
    functionGlobalContext: {
    }    // enables global context
}

module.exports = async function createServer () {

  const app = express()
  let mqttClient = new mqttHandler();
  mqttClient.connect();

  app.use(errorhandler())

  // Set express server port
  app.set('port', process.env.PORT || appConfig.port)
  app.use(morgan('dev'))
  app.use(bodyParser.urlencoded({ extended: false, inflate: true }))
  app.use(bodyParser.json({ strict: true, inflate: true }))
  app.use(responsePoweredBy("@JASON_HUANG"))
  app.use(responseTime())
  app.use(cors());

  app.all('/*', function(req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    // Set custom headers for CORS
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    next();
  });

  app.get('/', function(req, res) {
    res.json({ message: 'MQTT Client and API!' });
  });

  /**
   * Routes for the application
   */
  app.post('/users/login', userController.login)
  app.post('/users/register', userController.register)

  //Set token check middleware
  if(!debug)
    app.use(setCurrentUser)
  
  //MQTT publish
  app.post("/send-mqtt", function(req, res) {
    mqttClient.sendMessage(req.body.message);
    res.status(200).send("Message sent to mqtt");
  });

  //app.use('/', require('./routes/mySubApp'))
  app.use('/users', require('./routes/userRoute'))
  app.use('/cps', require('./routes/cpRoute'))
  app.use('/roles', require('./routes/roleRoute'))
  app.use('/types', require('./routes/typeRoute'))
  app.use('/devices', require('./routes/deviceRoute'))
  app.use('/classes', require('./routes/classRoute'))
  app.use('/commands', require('./routes/commandRoute'))
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
      console.log('mqtt_sub : ' + data);
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
