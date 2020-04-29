'use strict'

/*!
 * Module dependencies
 */

const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const Role = require('../db/models').Role

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
        let roles = await Role.findAll()
        resResources.getDtaSuccess(res, roles)
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
      let role_id = req.body.role_id || req.query.role_id
      let role_name = req.body.role_name || req.query.role_name
      let dataset = req.body.dataset || req.query.dataset
      //Check input data
      if(role_id == undefined || role_name == undefined)
      {
         return resResources.missPara(res)
      }

      if(typeof role_id == 'string')
        role_id = parseInt(role_id)
      
      if(dataset == undefined)
        dataset = role_id 
     
      let obj = {
        "role_id": role_id,
        "role_name": role_name,
        "dataset": dataset,
        "created_at": new Date(),
        "updated_at": new Date()
      }
      
      let newRole = await Role.create(obj)
      resResources.doSuccess(res, 'Create role success')
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  /*async show(req, res, next) { 
    try {
      let token = authResources.getInputToken(req)
      if(token === undefined) {
        return resResources.noAccess(res)
      }
      let id = req.params.id
      if(typeof(id) === 'string')
        id = parseInt(id)
      let verify = await authResources.tokenVerify(token)
      //Normal users can only see themselves
      if(verify.role_id > 2){
         return resResources.notAllowed(res)
      }
      let roles = await Role.findAll({
        where: {
            "id":id
        }
      })
      resResources.getDtaSuccess(res, roles[0])
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },*/

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
      

      let role_id = req.body.role_id || req.query.role_id
      let role_name = req.body.role_name || req.query.role_name
      let dataset = req.body.dataset || req.query.dataset

      //for normal user update name / password
      if(role_id != undefined)
        attributes['role_id'] = parseInt(role_id)
      if(role_name != undefined)
        attributes['role_name'] = role_name
      if(dataset != undefined)
        attributes['dataset'] = dataset
      attributes['updated_at'] = new Date()
      
      await Role.update(
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
      
      let verify = await authResources.tokenVerify(token)
      //Only administrators and super administrators have the right
      if(verify.role_id > 1 || id == 1){ //Can't delete main company
        return resResources.notAllowed(res)
      }
      result = await Role.destroy({
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