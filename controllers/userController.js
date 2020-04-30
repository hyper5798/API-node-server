'use strict'

/*!
 * Module dependencies
 */

const userResources = require('../lib/userResources')
const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')

module.exports = {
    async index(req, res, next) {
      try {
        let token = authResources.getInputToken(req)
        if(token === undefined) {
          return resResources.noAccess(res)
        }
        let verify = await authResources.tokenVerify(token)
        if(!verify || verify.cp_id == undefined){
          return resResources.notAllowed(res)
        }
        let users = await userResources.getCpUsers(verify.cp_id)
        resResources.getDtaSuccess(res, users)
      } catch (e) {
        resResources.catchError(res, e.message)
      }
    },

  async login(req, res, next) {
    try {
      //Get input data
      let email = req.body.email || req.query.email
      let password = req.body.password || req.query.password
      //Check input data
      if(email == undefined || password == undefined)
      {
        return resResources.missPara(res)
      }
      //Check user is exist?
      let dbUsers = await userResources.getUserByEmail(email)
      if(dbUsers.length == 0)
      {
        return resResources.notFound(res, 'Email not found')
      }
      //Check auth
      let dbUser = dbUsers[0];
      let isPass = await authResources.getCompare(password, dbUser.password)
      if(!isPass)
      {
        return resResources.authFail(res)
      }
      //Get Token
      if(dbUser) {
          delete dbUser.password
          delete dbUser.remember_token
          delete dbUser.created_at
          delete dbUser.updated_at 
      }
          
      dbUser.remember_token = await authResources.getToken(dbUser);
      //console.log(dbUser);
      resResources.getDtaSuccess(res, dbUser)
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async register(req, res, next) {
    try {
      //Get input data
      let token = authResources.getInputToken(req)
      let name = req.body.name || req.query.name
      let email = req.body.email || req.query.email
      let password = req.body.password || req.query.password
      let cp_id = req.body.cp_id || req.query.cp_id
      let role_id = req.body.role_id || req.query.role_id
      
      //Check input data
      if(name == undefined || email == undefined || password == undefined)
      {
        return resResources.missPara(res)
      }
      let hashCode = await authResources.getHashCode(password)
      let myHash = hashCode.replace('$2b$', '$2y$');
      let obj = {
        name: name,
        email: email,
        password: myHash,
        role_id: 9,
        cp_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
      //For admin to add user
      if(token !== undefined) {
        let verify = await authResources.tokenVerify(token)
        if(verify.role_id > 1) {//Except super admin
          obj['cp_id'] = verify.cp_id//Local admin add same cp user
        } else if(verify.role_id == 1) {//super admin
          if(cp_id != undefined)
            obj['cp_id'] = parseInt(cp_id)//Super admin can define cp
          else
            obj['cp_id'] = verify.cp_id//If no cp_id same as super admin
        } 
        if(verify.role_id <= 2) {//Both local and super admin
          if(role_id != undefined)
            role_id = parseInt(role_id)
          if(role_id < verify.role_id)
            role_id = verify.role_id
          obj['email_verified_at'] = new Date()
        }
      } 
      
      let newUser = await userResources.createUser(obj)
      console.log('Create user : '+ newUser)
      resResources.doSuccess(res, 'Register success')
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
      let id = req.params.id
      if(typeof(id) === 'string')
        id = parseInt(id)
      let verify = await authResources.tokenVerify(token)
      //Normal users can only see themselves
      if(verify.role_id > 2 && verify.id != id){
        return resResources.notAllowed(res)
      }
      let users = await userResources.getUserById(id)
      if(users.length>0)
        resResources.getDtaSuccess(res, users[0])
      else 
        resResources.getDtaSuccess(res, users)
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
      let id = req.params.id
      let cp_id = req.body.cp_id || req.query.cp_id
      let role_id = req.body.role_id || req.query.role_id
      let obj = {}
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      let verify = await authResources.tokenVerify(token)
      if(verify.role_id >2 && verify.id != id){
        //Normal users can only update themselves
        return resResources.notAllowed(res)
      } else if(verify.role_id == 2 && role_id == 1){
        //Admin change to super admin is not allowed
        return resResources.notAllowed(res)
      } else if (verify.role_id == 2 && role_id > 1){
        //For admin update name / password / role_id
        if(role_id != undefined)
            obj['role_id'] = parseInt(role_id)
      } else if (verify.role_id == 1){//Super admin
          if(role_id != undefined)
            obj['role_id'] = parseInt(role_id)
          if(cp_id != undefined)
            obj['cp_id'] = parseInt(cp_id)
      }
      
      let name = req.body.name || req.query.name
      let password = req.body.password || req.query.password

      //for normal user update name / password
      if(name != undefined)
          obj['name'] = name
      if(password != undefined){
        let hashCode = await authResources.getHashCode(password)
        //Replace to laravel hash format
        let myHash = hashCode.replace('$2b$', '$2y$');
        obj['password'] = myHash
      }
      obj['updated_at'] = new Date()
      
      await userResources.updateBId(id, obj)
      resResources.doSuccess(res, 'Update success')
    } catch (e) {
      resResources.catchError(res, e.message)
    }
  },

  async destroy(req, res, next) {
    try {
      let token = authResources.getInputToken(req)
      if(token === undefined) {
        //resResources will response message then stop
        return resResources.noAccess(res)
      }
      let id = req.params.id
      let result = 0
      if(typeof(id) === 'string')
        id = parseInt(id)
      
      let verify = await authResources.tokenVerify(token)
      //Only administrators and super administrators have the right
      if(verify.role_id > 2 || id == 1){
        return resResources.notAllowed(res)
      }
      
      //Administrators can delete users from the same company
      if(verify.role_id == 2)
        result = await userResources.destroyById2(id, verify.cp_id)
      else if(verify.role_id == 1)
        //Super administrators can delete all of users
        result = await userResources.destroyById(id)
      
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
