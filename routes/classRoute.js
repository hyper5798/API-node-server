/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict'

/*!
 * Module dependencies
 */
const express = require('express')
const classController = require('../controllers/classController')

const classRoute = express.Router()

classRoute.get('/', classController.index)

classRoute.post('/create',classController.create)
classRoute.get('/:id', classController.show)
classRoute.put('/:id', classController.update)
classRoute.delete('/:id', classController.destroy)

module.exports = classRoute