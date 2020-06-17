'use strict'

/*!
 * Module dependencies
 */

const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const Cp = require('../db/models').cp
const Promise = require('bluebird')

module.exports = {
    async index(req, res, next) {
      try {
        let verify = req.user
        if(verify.role_id !=1){
           return resResources.notAllowed(res)
        }
        let cps = await Promise.resolve(Cp.findAll())
        resResources.getDtaSuccess(res, cps)
      } catch (e) {
        resResources.catchError(res, e.message)
      }
    },

  async create(req, res, next) {
    try {
      //Get input data
      let verify = req.user
      if(verify.role_id !=1){
         return resResources.notAllowed(res)
      }
      let cp_name = req.body.cp_name || req.query.cp_name
      let phone = req.body.phone || req.query.phone
      let address = req.body.address || req.query.address
      //Check input data
      if(cp_name == undefined)
      {
         return resResources.missPara(res)
      }
      if(phone == undefined)
        phone = null
      if(address == undefined)
        address = null
      let obj = {
        "cp_name": cp_name,
        "phone": phone,
        "address": address,
        "created_at": new Date(),
        "updated_at": new Date()
      }
      
      let newCp = await Promise.resolve(Cp.create(obj))
      resResources.doSuccess(res, 'Create company success')
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async show(req, res, next) { 
    try {
      let verify = req.user
      if(verify.role_id !=1){
         return resResources.notAllowed(res)
      }
      let id = req.params.id
      if(typeof(id) === 'string')
        id = parseInt(id)

      let cps = await Promise.resolve(Cp.findAll({
        where: {
            "id":id
        }
      }))
      if(cps.length>0)
        resResources.getDtaSuccess(res, cps[0])
      else 
        resResources.getDtaSuccess(res, cps)
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
      
      /*if(verify.role_id >2 && verify.cp_id != id){
        return resResources.notAllowed(res)
      } else if(verify.role_id == 2 && verify.cp_id != id){
        //Admin cnahge other cp's data is not allowed
        return resResources.notAllowed(res)
      }*/ 
      let cp_name = req.body.cp_name || req.query.cp_name
      let phone = req.body.phone || req.query.phone
      let address = req.body.address || req.query.address

      //for normal user update name / password
      if(cp_name != undefined)
        attributes['cp_name'] = cp_name
      if(phone != undefined)
        attributes['phone'] = phone
      if(address != undefined){
        attributes['address'] = address
      }
      attributes['updated_at'] = new Date()
      
      await Promise.resolve(Cp.update(
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
      
      //Only administrators and super administrators have the right
      if(verify.role_id > 1 || id == 1){ //Can't delete main company
        return resResources.notAllowed(res)
      }
      result = await Promise.resolve(Cp.destroy({
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