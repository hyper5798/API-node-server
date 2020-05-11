
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
const mqttSubClient = require('./modules/mqttSubClient')
const userController = require('./controllers/userController')
const setCurrentUser = require('./middleware/setCurrentUser.js')

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

  app.use(errorhandler())

  // Set express server port
  app.set('port', process.env.PORT || 3000)
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
  //app.use(setCurrentUser)

  //app.use('/', require('./routes/mySubApp'))
  app.use('/users', require('./routes/userRoute'))
  app.use('/cps', require('./routes/cpRoute'))
  app.use('/roles', require('./routes/roleRoute'))
  app.use('/types', require('./routes/typeRoute'))
  app.use('/devices', require('./routes/deviceRoute'))
  app.use('/groups', require('./routes/groupRoute'))
  //app.use('/reports', require('./routes/reportRoute'))

  const server = http.createServer(app).listen(app.get('port'), '0.0.0.0', () => {
    console.log("Server started at http://localhost:" + app.get('port') + "/")
  })

  // Initialise the runtime with a server and settings
  RED.init(server,setting);

  // Serve the editor UI from /red
  app.use(setting.httpAdminRoot,RED.httpAdmin);

  // Serve the http nodes UI from /api
  app.use(setting.httpNodeRoot,RED.httpNode);

  // Start the runtime
  RED.start();

  // Create http server and attach express app on it
  return server

}
