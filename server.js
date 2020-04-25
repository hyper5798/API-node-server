
'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const responseTime = require('response-time')
const responsePoweredBy = require('response-powered-by')
const http = require('http')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const errorhandler = require('errorhandler')
//Jason add on 2020.02.16 - start
const RED = require("node-red")
const User = require('./db/models/user')

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
  app.use(responsePoweredBy("@NickNaso"))
  app.use(responseTime())

  /**
   * Routes for the application
   */
  app.use('/', require('./routes/mySubApp'))
  app.use('/', require('./routes/userRoute'))

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
