/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const cpController = require('../controllers/cpController')

const cpRoute = express.Router()

cpRoute.get('/', cpController.index)

cpRoute.post('/create', cpController.create)
cpRoute.get('/:id', cpController.show)
cpRoute.put('/:id', cpController.update)
cpRoute.delete('/:id', cpController.destroy)

module.exports = cpRoute
