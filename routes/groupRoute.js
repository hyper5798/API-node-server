/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const groupController = require('../controllers/groupController')

const groupRoute = express.Router()

groupRoute.get('/', groupController.index)

groupRoute.post('/create', groupController.create)
groupRoute.get('/:id', groupController.show)
groupRoute.put('/:id', groupController.update)
groupRoute.delete('/:id', groupController.destroy)

module.exports = groupRoute