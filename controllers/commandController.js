'use strict'

/*!
 * Module dependencies
 */

//const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const Command = require('../db/models').command

module.exports = {
    async index(req, res, next) {
      try {
        let verify = req.user
        if(verify.role_id != 1){
          return resResources.notAllowed(res)
        }
        let type_id = req.body.type_id || req.query.type_id
        if(type_id != undefined || type_id != null){
          if(typeof type_id == 'string')
            type_id = parseInt(type_id)
          let Commands = await Promise.resolve(Command.findAll({
            where: {
                "type_id":type_id
            }
          }))
          resResources.getDtaSuccess(res, Commands)
          return
        }
        let Commands = await Promise.resolve(Command.findAll())
        resResources.getDtaSuccess(res, Commands)
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
      let cmd_name = req.body.cmd_name || req.query.cmd_name
      let command = req.body.command || req.query.command
      //Check input data
      if(type_id == undefined || cmd_name == undefined || command == undefined)
      {
         return resResources.missPara(res)
      }

      if(typeof type_id == 'string')
        type_id = parseInt(type_id)
     
      let obj = {
        "type_id": type_id,
        "cmd_name": cmd_name,
        "command": command,
        "created_at": new Date(),
        "updated_at": new Date()
      }
      
      let newCommand = await Promise.resolve(Command.create(obj))
      console.log(newCommand)
      resResources.doSuccess(res, 'Create command success')
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
      
      let Commands = await Promise.resolve(Command.findAll({
        where: {
            "id":id
        }
      }))
      if(Commands.length>0)
        resResources.getDtaSuccess(res, Commands[0])
      else 
        resResources.getDtaSuccess(res, Commands)
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
      let Commands = await Promise.resolve(Command.findAll({
        where: {
            "id":id
        }
      }))
      if(Commands.length == 0){
        return resResources.notFound(res)
      }
      let attributes = {}
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      let type_id = req.body.type_id || req.query.type_id
      let cmd_name = req.body.cmd_name || req.query.cmd_name
      let command = req.body.command || req.query.command

      //for normal user update name / password
      if(type_id != undefined)
        attributes['type_id'] = parseInt(type_id)
      if(cmd_name != undefined)
        attributes['cmd_name'] = cmd_name
      if(command != undefined)
        attributes['command'] = command
      attributes['updated_at'] = new Date()
      
      await Promise.resolve(Command.update(
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
      
      result = await Promise.resolve(Command.destroy({
        where: {
            "id":id
        }
      }))
      
      if(result == 0){
        resResources.notFound(res)
      } else {
        resResources.doSuccess(res, 'Delete success')
      }
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  }
}
