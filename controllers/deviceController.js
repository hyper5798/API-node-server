'use strict'

/*!
 * Module dependencies
 */

const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const Device = require('../db/models').device

module.exports = {
    async index(req, res, next) {
      try {
        let verify = req.user
        /*if(verify.role_id != 1){
          return resResources.notAllowed(res)
        }*/
        let devices = await Promise.resolve(Device.findAll({
          where: {
              "cp_id":verify.cp_id
          }
        }))
        resResources.getDtaSuccess(res, devices)
      } catch (e) {
        resResources.catchError(res, e.message)
      }
    },

  async create(req, res, next) {
    try {
      //Get input data
      let verify = req.user
      /*if(verify.role_id != 1){
        return resResources.notAllowed(res)
      }*/
      let mac = req.body.mac || req.query.mac
      let device_name = req.body.device_name || req.query.device_name
      let description = req.body.description || req.query.description
      let image_url = req.body.image_url || req.query.image_url
      let type_id = req.body.type_id || req.query.type_id
      //Check input data
      if(mac == undefined || type_id == undefined)
         return resResources.missPara(res)

      if(device_name == undefined)
        device_name = mac

      if(typeof type_id == 'string')
        type_id = parseInt(type_id)
     
      let obj = {
        "mac": mac,
        "device_name": device_name,
        "status": 1,
        "cp_id": verify.cp_id,
        "user_id": verify.id,
        "type_id": type_id,
        "created_at": new Date(),
        "updated_at": new Date()
      }
      if(description != undefined)
        obj['description'] = description
      if(image_url != undefined)
        obj['image_url'] = image_url
      
      let newTYpe = await Promise.resolve(Device.create(obj))
      console.log(typeof newTYpe)
      resResources.doSuccess(res, 'Create device success')
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async show(req, res, next) { 
    try {
      let verify = req.user
      /*if(verify.role_id != 1){
         return resResources.notAllowed(res)
      }*/
      let id = req.params.id
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      let devices = await Promise.resolve(Device.findAll({
        where: {
            "id":id,
            "cp_id": verify.cp_id
        }
      }))
      if(devices.length>0)
        resResources.getDtaSuccess(res, devices[0])
      else 
        resResources.getDtaSuccess(res, devices)
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async update(req, res, next) {
    try {
      //Get input data
      let attributes = {}
      let verify = req.user
      
      if(verify.role_id > 2) //User can't update devices
        return resResources.notAllowed(res)
     
      let id = req.params.id

      let devices = await Promise.resolve(Device.findAll({where: {"id":id}}))
      if(devices.length == 0)
        return resResources.notFound(res)

      let device = devices[0]
      
      if(verify.role_id == 2 && verify.cp_id != device.cp_id)
        return resResources.notAllowed(res)
      
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      let mac = req.body.mac || req.query.mac
      let device_name = req.body.device_name || req.query.device_name
      let description = req.body.description || req.query.description
      let image_url = req.body.image_url || req.query.image_url
      let cp_id = req.body.cp_id || req.query.cp_id
      let type_id = req.body.type_id || req.query.type_id

      //for normal user update name / password
      if(mac != undefined)
        attributes['mac'] = mac
      if(device_name != undefined)
        attributes['device_name'] = device_name

      if(description != undefined)
        attributes['description'] = description

      if(image_url != undefined)
        attributes['image_url'] = image_url

      if(cp_id != undefined) 
          attributes['cp_id'] = cp_id

      if(type_id != undefined)
        attributes['type_id'] = type_id

      attributes['updated_at'] = new Date()
      
      await Promise.resolve(Device.update(
        /* set attributes' value */
        attributes,
        /* condition for find*/
        { where: { "id": id} }
      ))
      
      resResources.doSuccess(res, 'Update success')
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async destroy(req, res, next) {
    try {
      let verify = req.user
      if(verify.role_id > 2) //User can't update devices
        return resResources.notAllowed(res)
        
      let id = req.params.id
      let result = 0
      if(typeof(id) === 'string')
        id = parseInt(id)
      //Local administrator can delete device of same companies
      if(verify.role_id == 2)
        result = await Device.destroy({
          where: {
              "id":id,
              "cp_id":verify.cp_id
          }
        })
      else
        //Super administrator can delete all of devices
        result = await Promise.resolve(Device.destroy({
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
