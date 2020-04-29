/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const roleController = require('../controllers/roleController')

const roleRoute = express.Router()

roleRoute.get('/', roleController.index)

roleRoute.post('/create', roleController.create)
//roleRoute.get('/:id', roleController.show)
roleRoute.put('/:id', roleController.update)
roleRoute.delete('/:id', roleController.destroy)

module.exports = roleRoute
