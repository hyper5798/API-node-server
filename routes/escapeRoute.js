/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const escapeRoute = express.Router()
const escapeController = require('../controllers/escapeController')

escapeRoute.get('/default', escapeController.getDefaultMission)
escapeRoute.get('/command', escapeController.sendMqttCmd)
escapeRoute.get('/action', escapeController.setMissionAction)
escapeRoute.get('/data', escapeController.getMissionData)
escapeRoute.get('/start', escapeController.setMissionStart)
escapeRoute.get('/end', escapeController.setMissionEnd)
escapeRoute.get('/status', escapeController.getMissionStatus)
escapeRoute.get('/pass', escapeController.setMissionPass)
escapeRoute.get('/fail', escapeController.setMissionFail)
escapeRoute.get('/stop', escapeController.setEmergencyStop)
escapeRoute.get('/reduce', escapeController.setReduce)
module.exports = escapeRoute
