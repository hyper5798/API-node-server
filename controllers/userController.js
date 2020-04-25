'use strict'

/*!
 * Module dependencies
 */
const User = require('../lib/userResources')
const asyncResources = require('../lib/asyncResources')
module.exports = {
    async index(req, res, next) {
        try {
          let jane = await User.getAllUser()
          res.status(200).send(jane)
        } catch (e) {
          next(e)
        }
    },
  async getResources(req, res, next) {
    try {
      let resources = await asyncResources.getAsyncResources()
      res.status(200).send(resources)
    } catch (e) {
      next(e)
    }
  },

  async postResource(req, res, next) {
    try {
      let resource = {
        firstName: "Dennis",
        lastName: "Ritchie"
      }
      resource = await asyncResources.createAysncResource(resource)
      res.status(201).send(resource)
    } catch (e) {
      next(e)
    }
  },

  async putResource(req, res, next) {
    try {
      let resource = {
        firstName: "Dennis",
        lastName: "Ritchie"
      }
      resource = await asyncResources.updateAsyncResource(resource)
      res.status(200).send(resource)
    } catch (e) {
      next(e)
    }
  },

  async deleteResource(req, res, next) {
    try {
      let resource = {
        firstName: "Dennis",
        lastName: "Ritchie"
      }
      resource = await asyncResources.deleteAsyncResources(resource)
      res.status(200).send(resource)
    } catch (e) {
      next(e)
    }
  }

}
