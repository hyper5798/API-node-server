'use strict'

/*!
 * Module dependencies
 */

const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const Group = require('../db/models').Group

module.exports = {
    async index(req, res, next) {
      try {
        let verify = req.user
        if(verify.role_id > 2){
          return resResources.notAllowed(res)
        }
        let groups = await Promise.resolve(Group.findAll({
          where: {
              "cp_id":verify.cp_id
          }
        }))
        resResources.getDtaSuccess(res, groups)
      } catch (e) {
        resResources.catchError(res, e.message)
      }
    },

  async create(req, res, next) {
    try {
      //Get input data
      let verify = req.user
      //Normal user can't create group 
      if(verify.role_id > 2)
        return resResources.notAllowed(res)
      
      let name = req.body.name || req.query.name
      let cp_id = req.body.cp_id || req.query.cp_id
      let group_option = req.body.group_option || req.query.group_option
      let members = req.body.members || req.query.members
      let devices = req.body.devices || req.query.devices
      //Check input data
      if(name == undefined)
         return resResources.missPara(res)

      if(cp_id != undefined && typeof cp_id == 'string')
        cp_id = parseInt(cp_id)
      else
        cp_id = verify.cp_id
      
      //Local administrators only create company groups
      if(verify.role_id == 2 && verify.cp_id != cp_id)
        cp_id = verify.cp_id
        
      if(group_option != undefined && typeof group_option == 'string')
        group_option = parseInt(group_option)
      else
        group_option = 1//Only can add members
     
      let obj = {
        "name": name,
        "cp_id": cp_id,
        "group_option": group_option,
        "members": null,
        "devices": null,
        "created_at": new Date(),
        "updated_at": new Date()
      }
      if(members != undefined && typeof(members)==='string'){
        if(group_option == 1 || group_option == 3)
          obj['members'] = JSON.stringify(JSON.parse(members))
      }
        
      if(devices != undefined && typeof(devices)==='string') {
        if(group_option == 2 || group_option == 3)
          obj['devices'] = JSON.stringify(JSON.parse(devices))
      }
      
      let newGroup = await Promise.resolve(Group.create(obj))
      console.log(typeof newGroup)
      resResources.doSuccess(res, 'Create group success')
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
      
      let groups = await Promise.resolve(Group.findAll({
        where: {
            "id":id,
            "cp_id": verify.cp_id
        }
      }))
      if(groups.length>0)
        resResources.getDtaSuccess(res, groups[0])
      else 
        resResources.getDtaSuccess(res, groups)
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async update(req, res, next) {
    try {
      //Get input data
      let verify = req.user
      let attributes = {}
      if(verify.role_id > 2) //User can't update groups
        return resResources.notAllowed(res)
     
      let id = req.params.id

      let groups = await Promise.resolve(Group.findAll({where: {"id":id}}))
      if(groups.length == 0)
        return resResources.notFound(res)

      let group = groups[0]
      
      if(verify.role_id == 2 && verify.cp_id != group.cp_id)
        return resResources.notAllowed(res)
      
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      let name = req.body.name || req.query.name
      let group_option = req.body.group_option || req.query.group_option
      let members = req.body.members || req.query.members
      let devices = req.body.devices || req.query.devices

      //for normal user update name / password
      if(name != undefined)
        attributes['name'] = name

      if(group_option != undefined) {
        group_option = parseInt(group_option)
        attributes['group_option'] = group_option
      } else {
        group_option = group.group_option
      }

      if(members != undefined && typeof(members)==='string'){
        if(group_option == 1 || group_option == 3)
          attributes['members'] = JSON.stringify(JSON.parse(members))
        if(group_option == 1)
          attributes['devices'] = null
      }
        
      if(devices != undefined && typeof(devices)==='string') {
        if(group_option == 2 || group_option == 3)
          attributes['devices'] = JSON.stringify(JSON.parse(devices))
        if(group_option == 2)
          attributes['members'] = null
      }

      attributes['updated_at'] = new Date()
      
      await Promise.resolve(Group.update(
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
      if(verify.role_id > 2) //User can't update groups
        return resResources.notAllowed(res)
        
      let id = req.params.id
      let result = 0
      if(typeof(id) === 'string')
        id = parseInt(id)
      //Local administrator can delete group of same companies
      if(verify.role_id == 2)
        result = await Group.destroy({
          where: {
              "id":id,
              "cp_id":verify.cp_id
          }
        })
      else
        //Super administrator can delete all of groups
        result = await Promise.resolve(Group.destroy({
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
