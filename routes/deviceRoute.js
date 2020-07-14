/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const deviceController = require('../controllers/deviceController')

const deviceRoute = express.Router()

deviceRoute.get('/', deviceController.index)

deviceRoute.post('/binding', deviceController.binding)
deviceRoute.get('/:id', deviceController.show)
deviceRoute.put('/:id', deviceController.update)
deviceRoute.delete('/:id', deviceController.destroy)
deviceRoute.post('/verify', deviceController.verify)

module.exports = deviceRoute
