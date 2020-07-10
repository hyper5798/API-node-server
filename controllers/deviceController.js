'use strict'

/*!
 * Module dependencies
 */

const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const Device = require('../db/models').device
const Product = require('../db/models').product
const Promise = require('bluebird')
const redisHandler  = require('../modules/redisHandler')


module.exports = {
  async index(req, res, next) {
    try {
      let verify = req.user

      let obj = {}
      let devices = [];
      if(verify.role_id == 1) {//Super Admin
        let cpId = req.body.cp_id || req.query.cp_id
        if(cpId == undefined || cpId == null)
          cpId = verify.cp_id
          obj.cp_id = cpId
      } if(verify.role_id == 2) {//Local Admin
        obj.cp_id = verify.cp_id
      } if(verify.role_id > 2) {//Local Admin
        obj.cp_id = verify.cp_id
        obj.user_id = verify.id 
      }
      devices = await Promise.resolve(Device.findAll(
        {
          where: obj,
          attributes: ['id','device_name','macAddr','make_command']
        }))
        
      resResources.getDtaSuccess(res, devices)
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async binding(req, res, next) {
    try {
      //Get input data
      let verify = req.user
      
      let mac = req.body.mac || req.query.mac
      let device_name = req.body.device_name || req.query.device_name
      let description = req.body.description || req.query.description
      let image_url = req.body.image_url || req.query.image_url
      let type_id = req.body.type_id || req.query.type_id
      if(verify.role_id == 9){
        type_id = 9//For escape device
      } else if(verify.role_id == 11){
        type_id = 11//For controller user
      }
      //Check input data
      if(mac == undefined || type_id == undefined)
         return resResources.missPara(res)
      //Check device mac is belong of yesio or not?
      if(await verifyMac(mac) == false) {
        return resResources.notFound(res,'This mac is not found in product list')
      }
      //Check the mac is exist in binding list or not?
      let device = await getBindingDevice(mac)
      if(device) {
        return resResources.notAllowed(res,'This mac is bound')
      }
      

      if(device_name == undefined)
        device_name = mac

      if(typeof type_id == 'string')
        type_id = parseInt(type_id)
     
      let obj = {
        "macAddr": mac,
        "device_name": device_name,
        "status": 1,
        "cp_id": verify.cp_id,
        "user_id": verify.id,
        "type_id": type_id,
        "network_id": 1,
        "make_command":false,
        "created_at": new Date(),
        "updated_at": new Date()
      }
      if(description != undefined)
        obj['description'] = description
      if(image_url != undefined)
        obj['image_url'] = image_url
      
      let newTYpe = await Promise.resolve(Device.create(obj))
      console.log(typeof newTYpe)
      resResources.doSuccess(res, 'Binding device success')
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

async function verifyMac(mac) {
  const redisClient = new redisHandler(0)
  redisClient.connect();
  let deviceId = await redisClient.hgetValue('product', mac)
  let product = null
  if(deviceId === undefined || deviceId === null) {
    //product = await Product.findAll()
    product = await Product.findOne({
      where: { "macAddr": mac }, // where 條件
      //attribute: []  //指定回傳欄位
    })
    if(product== null)
      return false
    else {
      redisClient.hsetValue('product',mac, product.id)
      return true
    }
      
  } else {
    return true
  }
}

function getBindingDevice(mac) {
  return Promise.resolve(Device.findOne({
    where: { "macAddr": mac }, // where 條件
      //attribute: []  //指定回傳欄位
    }))
}
