/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const commandController = require('../controllers/commandController')

const commandRoute = express.Router()

commandRoute.get('/', commandController.index)

commandRoute.post('/create', commandController.create)
commandRoute.get('/:id', commandController.show)
commandRoute.put('/:id', commandController.update)
commandRoute.delete('/:id', commandController.destroy)

module.exports = commandRoute
