'use strict'

/*!
 * Module dependencies
 */

const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const Class = require('../db/models').classes

module.exports = {
    async index(req, res, next) {
      try {
        let verify = req.user
        if(verify.role_id > 2){
          return resResources.notAllowed(res)
        }
        let Classes = await Promise.resolve(Class.findAll({
          where: {
              "cp_id":verify.cp_id
          }
        }))
        resResources.getDtaSuccess(res, Classes)
      } catch (e) {
        resResources.catchError(res, e.message)
      }
    },

  async create(req, res, next) {
    try {
      //Get input data
      let verify = req.user
      //Normal user can't create class
      if(verify.role_id > 2)
        return resResources.notAllowed(res)
      
      let class_name = req.body.class_name || req.query.class_name
      let cp_id = req.body.cp_id || req.query.cp_id
      let class_option = req.body.class_option || req.query.class_option
      let members = req.body.members || req.query.members
      let devices = req.body.devices || req.query.devices
      //Check input data
      if(class_name == undefined)
         return resResources.missPara(res)

      if(cp_id != undefined && typeof cp_id == 'string')
        cp_id = parseInt(cp_id)
      else
        cp_id = verify.cp_id
      
      //Local administrators only create company classes
      if(verify.role_id == 2 && verify.cp_id != cp_id)
        cp_id = verify.cp_id
        
      if(class_option != undefined && typeof class_option == 'string')
        class_option = parseInt(class_option)
      else
      class_option = 1//Only can add members
     
      let obj = {
        "class_name": class_name,
        "cp_id": cp_id,
        "class_option": class_option,
        "members": null,
        "devices": null,
        "created_at": new Date(),
        "updated_at": new Date()
      }
      if(members != undefined && typeof(members)==='string'){
        if(class_option == 1 || class_option == 3)
          obj['members'] = JSON.stringify(JSON.parse(members))
      }
        
      if(devices != undefined && typeof(devices)==='string') {
        if(class_option == 2 || class_option == 3)
          obj['devices'] = JSON.stringify(JSON.parse(devices))
      }
      
      let newClass = await Promise.resolve(Class.create(obj))
      console.log(typeof newClass)
      resResources.doSuccess(res, 'Create class success')
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
      
      let classes = await Promise.resolve(Class.findAll({
        where: {
            "id":id,
            "cp_id": verify.cp_id
        }
      }))
      if(classes.length>0)
        resResources.getDtaSuccess(res,  classes[0])
      else 
        resResources.getDtaSuccess(res,  classes)
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async update(req, res, next) {
    try {
      //Get input data
      let verify = req.user
      let attributes = {}
      if(verify.role_id > 2) //User can't update classes
        return resResources.notAllowed(res)
     
      let id = req.params.id

      let classes = await Promise.resolve(Class.findAll({where: {"id":id}}))
      if( classes.length == 0)
        return resResources.notFound(res)

      let findClass =  classes[0]
      
      if(verify.role_id == 2 && verify.cp_id != findClass.cp_id)
        return resResources.notAllowed(res)
      
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      let class_name = req.body.class_name || req.query.class_name
      let class_option = req.body.class_option || req.query.class_option
      let members = req.body.members || req.query.members
      let devices = req.body.devices || req.query.devices

      //for normal user update name / password
      if(class_name != undefined)
        attributes['class_name'] = class_name

      if(class_option != undefined) {
        class_option = parseInt(class_option)
        attributes['class_option'] = class_option
      } else {
        class_option = findClass.class_option
      }

      if(members != undefined && typeof(members)==='string'){
        if(class_option == 1 || class_option == 3)
          attributes['members'] = JSON.stringify(JSON.parse(members))
        if(class_option == 1)
          attributes['devices'] = null
      }
        
      if(devices != undefined && typeof(devices)==='string') {
        if(class_option == 2 || class_option == 3)
          attributes['devices'] = JSON.stringify(JSON.parse(devices))
        if(class_option == 2)
          attributes['members'] = null
      }

      attributes['updated_at'] = new Date()
      
      await Promise.resolve(Class.update(
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
      if(verify.role_id > 2) //User can't update classes
        return resResources.notAllowed(res)
        
      let id = req.params.id
      let result = 0
      if(typeof(id) === 'string')
        id = parseInt(id)
      //Local administrator can delete class of same companies
      if(verify.role_id == 2)
        result = await Class.destroy({
          where: {
              "id":id,
              "cp_id":verify.cp_id
          }
        })
      else
        //Super administrator can delete all of classes
        result = await Promise.resolve(Class.destroy({
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
