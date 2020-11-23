'use strict'

/*!
 * Module dependencies
 */

const resResources = require('../lib/resResources')
const Cp = require('../db/models').cp
const App = require('../db/models').app
const Promise = require('bluebird')


module.exports = {
    async index(req, res, next) {
      try {
        let verify = req.user
        if(verify.role_id !=1){
           return resResources.notAllowed(res)
        }
        let reports = await Report .findAll({
          where: {
              "id":verify.cp_id
          }
        })
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
      
      let newCp = await Cp.create(obj)
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

      let cps = await Cp.findAll({
        where: {
            "id":id
        }
      })
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
      
      if(verify.role_id >2 && verify.cp_id != id){
        return resResources.notAllowed(res)
      } else if(verify.role_id == 2 && verify.cp_id != id){
        //Admin cnahge other cp's data is not allowed
        return resResources.notAllowed(res)
      } 
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
      
      await Cp.update(
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
      result = await Cp.destroy({
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
  },

  async write(req, res, next) {
    const Report = require('../db/models').report
    try {
      //Get key and id
      const redisHandler  = require('../modules/redisHandler')
      const redisClient = new redisHandler(1)
      redisClient.connect();
      let api_key = req.query.api_key
      let app_id = getAppId(api_key) 
      if(!app_id) {
        console.log('api_key !== app.api_key');
        return resResources.notAllowed(res)
      }
      let  recv = req.body.time || req.query.time || new Date()
        
      //Get app by parse id
      let app = await Promise.resolve(App.findOne({where: {"id":app_id}}))
      if(api_key !== app.api_key) { 
        console.log('api_key !== app.api_key');
        return resResources.notAllowed(res)
      }
      let mac = app.macAddr
      let time = await redisClient.hgetValue('products', mac)
      console.log('time from redis:'+time);
      if(time != null) {
        let oldTime = new Date(time).getTime();
        let nowTime = new Date().getTime();
        let diff = (nowTime-oldTime)/1000;
        console.log('diff:'+diff);
        if(diff<=3) {
          return resResources.notAllowed(res, 'The upload interval less then 3 seconds!')
        }
      }
      let utcTime = new Date().toISOString()
      //Update upload time
      redisClient.hsetValue('products', mac, utcTime)
      if(typeof(app.key_label) !== 'object') 
          app.key_label = JSON.parse(app.key_label)
      //Get app labels
      let keys = Object.keys(app.key_label)
      //console.log(keys);
      let obj = {
        "macAddr": mac,
        "app_id": app_id,
        "recv": recv
      }
      let list = {}
      /*for(let i=0;i<8; i++) {
        let target = 'key' + (i+1)
        list[target] = req.query[target]
      }*/
      for(let i=0;i<keys.length; i++) {
        let key = keys[i];
        if(req.query[key])
          obj[key] = parseFloat(req.query[key]) 
        else
          obj[key] = null
      }

      console.log(obj);
      let newReport = await Report.create(obj)
      redisClient.quit()
      resResources.doSuccess(res, 'Create report success')
      
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async read(req, res, next) {
    const Report = require('../db/models').report
    try {
      //Get key and id
      let api_key = req.query.api_key
      let app_id = getAppId(api_key) 
      if(!app_id)
        return resResources.notAllowed(res)
      let limit = req.query.result
      let offset = req.query.page
      //Get app by parse id
      let app = await Promise.resolve(App.findOne({
        where: {
          "id":app_id
        }
      }))
      if(api_key !== app.api_key) {
        return resResources.notAllowed(res)
      }
      if(api_key !== app.api_key) {
        return resResources.notAllowed(res)
      }
      let label = app.key_label
      if(typeof(label) !== 'object') 
          label = JSON.parse(app.key_label)

      let keys = Object.keys(label)
      let arr1 = ['recv'];
      let arr2 = arr1.concat(keys)
      let options = {
        where: {"app_id":app_id, "macAddr":app.macAddr},
        attributes:arr2
      }
      if(limit)
        options.limit = parseInt(limit) 
      if(offset) {
        options.offset = (parseInt(offset) - 1 ) * options.limit
      }
        
      let reports = await Promise.resolve(Report.findAll(options));
      let ch = {'id': app.id, 'name':app.name}
      
      for(let i=0;i<keys.length;i++) {
        let key = keys[i]
        ch[key] = label[key]
      }
      let result = {"app":ch, "reports": reports}


     
      resResources.getDtaSuccess(res, result)
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },
}

function decode_base64(str) {
  return new Buffer(str, 'base64').toString();
}

function encode_base64(str) {
  return new Buffer(str).toString('base64');
}

function getAppId(api_key) {
  let test = decode_base64(api_key)
  let arr = test.split('.')
  if(arr.length <2) {
    return null
  } 
  return parseInt(arr[1])
}