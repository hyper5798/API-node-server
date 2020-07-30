'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const settingController = require('../controllers/settingController')

const settingRoute = express.Router()

settingRoute.get('/', settingController.index)
settingRoute.post('/create', settingController.create)
settingRoute.get('/:id', settingController.show)
settingRoute.put('/:id', settingController.update)
settingRoute.delete('/:id', settingController.destroy)

module.exports = settingRoute
