/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const roleController = require('../controllers/roleController')

const cpRoute = express.Router()

cpRoute.get('/', roleController.index)

cpRoute.post('/create', roleController.create)
//cpRoute.get('/:id', roleController.show)
cpRoute.put('/:id', roleController.update)
cpRoute.delete('/:id', roleController.destroy)

module.exports = cpRoute
