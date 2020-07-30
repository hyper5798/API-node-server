'use strict'

/*!
 * Module dependencies
 */

const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const Setting = require('../db/models').setting

module.exports = {
    async index(req, res, next) {
      try {
        let verify = req.user
        if(verify.role_id != 1){
          return resResources.notAllowed(res)
        }
        let type_id = req.body.type_id || req.query.type_id
        let app_id = req.body.app_id || req.query.app_id
        let settings = [];
        if(type_id != null) {
          type_id = parseInt(type_id)
          settings = await Promise.resolve(Setting.findAll({where: {"type_id":type_id}}))
        } if(app_id != null) {
          app_id = parseInt(app_id)
          settings = await Promise.resolve(Setting.findAll({where: {"app_id":id}}))
        }
        resResources.getDtaSuccess(res, settings)
      } catch (e) {
        resResources.catchError(res, e.message)
      }
    },

  async create(req, res, next) {
    try {
      //Get input data
      let verify = req.user
      if(verify.role_id != 1){
        return resResources.notAllowed(res)
      }
      let type_id = req.body.type_id || req.query.type_id
      let app_id = req.body.app_id || req.query.app_id
      let field = req.body.field || req.query.field
      let set = req.body.set || req.query.set
      
      //Check input data
      if(field == undefined || set == undefined )
      {
         return resResources.missPara(res)
      }
      if(type_id == undefined && app_id == undefined )
      {
         return resResources.missPara(res)
      }
      
      if(typeof(set) == 'string')
        set = JSON.stringify(JSON.parse(set))
     
      let obj = {
        "field": field,
        "set": set,
        "created_at": new Date(),
        "updated_at": new Date()
      }

      if(type_id != undefined) {
        if(typeof type_id == 'string')
          obj.type_id = parseInt(type_id)
        else
          obj.type_id = type_id
      }
      
      if(app_id != undefined) {
        if(typeof app_id == 'string')
          obj.app_id = parseInt(app_id)
        else
          obj.app_id = app_id
      }
      
      let newSet = await Promise.resolve(Setting.create(obj))
      console.log(typeof newSet)
      resResources.doSuccess(res, 'Create setting success')
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async show(req, res, next) { 
    try {
      let verify = req.user
      if(verify.role_id != 1){
         return resResources.notAllowed(res)
      }
      let id = req.params.id
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      let settings = await Promise.resolve(Setting.findAll({
        where: {
            "id":id
        }
      }))
      if(settings.length>0)
        resResources.getDtaSuccess(res, settings[0])
      else 
        resResources.getDtaSuccess(res, settings)
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async update(req, res, next) {
    try {
      //Get input data
      let verify = req.user
      if(verify.role_id != 1){
        return resResources.notAllowed(res)
      }
      let id = req.params.id
      let attributes = {}
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      let type_id = req.body.type_id || req.query.type_id
      let app_id = req.body.app_id || req.query.app_id
      let field = req.body.field || req.query.field
      let set = req.body.set || req.query.set

      if(set != undefined && typeof(set) == 'string')
        set = JSON.stringify(JSON.parse(set))

      //for normal user update name / password
      if(type_id != undefined)
        attributes['type_id'] = parseInt(type_id)
      if(app_id != undefined)
        attributes['app_id'] = parseInt(app_id)
      if(field != undefined)
        attributes['field'] = field
      if(set != undefined)
        attributes['set'] = set
      
      attributes['updated_at'] = new Date()
      
      await Promise.resolve(Setting.update(
        /* set attributes' value */
        attributes,
        /* condition for find*/
        { where: { "id": id }}
      ))
      resResources.doSuccess(res, 'Update success')
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async destroy(req, res, next) {
    try {
      let verify = req.user
      if(verify.role_id != 1){
        return resResources.notAllowed(res)
      }
      let id = req.params.id
      let result = 0
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      result = await Promise.resolve(Setting.destroy({
        where: {
            "id":id
        }
      }))
      
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
