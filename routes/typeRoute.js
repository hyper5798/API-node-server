/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const typeController = require('../controllers/typeController')

const typeRoute = express.Router()

typeRoute.get('/', typeController.index)

typeRoute.post('/create', typeController.create)
typeRoute.get('/:id', typeController.show)
typeRoute.put('/:id', typeController.update)
typeRoute.delete('/:id', typeController.destroy)

module.exports = typeRoute
