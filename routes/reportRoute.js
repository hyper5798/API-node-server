/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const reportController = require('../controllers/reportController')

const reportRoute = express.Router()

reportRoute.get('/', reportController.index)
reportRoute.post('/create', reportController.create)
reportRoute.delete('/', reportController.destroy)

module.exports = reportRoute