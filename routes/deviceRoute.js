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

deviceRoute.post('/create', deviceController.create)
deviceRoute.get('/:id', deviceController.show)
deviceRoute.put('/:id', deviceController.update)
deviceRoute.delete('/:id', deviceController.destroy)

module.exports = deviceRoute
