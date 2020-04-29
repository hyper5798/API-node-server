'use strict'

/*!
 * Module dependencies
 */

const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const Type = require('../db/models').Type

module.exports = {
    async index(req, res, next) {
      try {
        let token = authResources.getInputToken(req)
        if(token === undefined) {
          return resResources.noAccess(res)
        }
        let verify = await authResources.tokenVerify(token)
        if(verify.role_id != 1){
          return resResources.notAllowed(res)
        }
        let types = await Type.findAll()
        resResources.getDtaSuccess(res, types)
      } catch (e) {
        resResources.catchError(res, e.message)
      }
    },

  async create(req, res, next) {
    try {
      //Get input data
      let token = authResources.getInputToken(req)
      if(token === undefined) {
        return resResources.noAccess(res)
      }
      let verify = await authResources.tokenVerify(token)
      if(verify.role_id != 1){
        return resResources.notAllowed(res)
      }
      let type_id = req.body.type_id || req.query.type_id
      let type_name = req.body.type_name || req.query.type_name
      let description = req.body.description || req.query.description
      let image_url = req.body.image_url || req.query.image_url
      let rules = req.body.rules || req.query.rules
      //Check input data
      if(type_id == undefined || type_name == undefined || rules == undefined)
      {
         return resResources.missPara(res)
      }

      if(typeof type_id == 'string')
        type_id = parseInt(type_id)
      if(typeof(rules) == 'string')
        rules = JSON.stringify(JSON.parse(rules))
     
      let obj = {
        "type_id": type_id,
        "type_name": type_name,
        "rules": rules,
        "created_at": new Date(),
        "updated_at": new Date()
      }
      if(description != undefined)
        obj['description'] = description
      if(image_url != undefined)
        obj['image_url'] = image_url
      
      let newTYpe = await Type.create(obj)
      console.log(typeof newTYpe)
      resResources.doSuccess(res, 'Create type success')
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async show(req, res, next) { 
    try {
      let token = authResources.getInputToken(req)
      if(token === undefined) {
        return resResources.noAccess(res)
      }
      let verify = await authResources.tokenVerify(token)
      if(verify.role_id != 1){
         return resResources.notAllowed(res)
      }
      let id = req.params.id
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      let types = await Type.findAll({
        where: {
            "id":id
        }
      })
      if(types.length>0)
        resResources.getDtaSuccess(res, types[0])
      else 
        resResources.getDtaSuccess(res, types)
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async update(req, res, next) {
    try {
      //Get input data
      let token = authResources.getInputToken(req)
      if(token === undefined) {
        return resResources.noAccess(res)
      }
      let verify = await authResources.tokenVerify(token)
      if(verify.role_id != 1){
        return resResources.notAllowed(res)
      }
      let id = req.params.id
      let attributes = {}
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      
      let type_id = req.body.type_id || req.query.type_id
      let type_name = req.body.type_name || req.query.type_name
      let description = req.body.description || req.query.description
      let image_url = req.body.image_url || req.query.image_url
      let rules = req.body.rules || req.query.rules

      //for normal user update name / password
      if(type_id != undefined)
        attributes['type_id'] = parseInt(type_id)
      if(type_name != undefined)
        attributes['type_name'] = type_name
      if(description != undefined)
        attributes['description'] = description
      if(image_url != undefined)
        attributes['image_url'] = image_url
      if(rules != undefined)
        attributes['rules'] = rules
      attributes['updated_at'] = new Date()
      
      await Type.update(
        /* set attributes' value */
        attributes,
        /* condition for find*/
        { where: { "id": id }}
      )
      resResources.doSuccess(res, 'Update success')
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async destroy(req, res, next) {
    try {
      let token = authResources.getInputToken(req)
      if(token === undefined) {
        return resResources.noAccess(res)
      }
      let verify = await authResources.tokenVerify(token)
      if(verify.role_id != 1){
        return resResources.notAllowed(res)
      }
      let id = req.params.id
      let result = 0
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      result = await Type.destroy({
        where: {
            "id":id
        }
      })
      
      if(result == 0){
        resResources.notAllowed(res)
      } else {
        resResources.doSuccess(res, 'Delete success')
      }
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  }
}
