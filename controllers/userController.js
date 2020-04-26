'use strict'

/*!
 * Module dependencies
 */

const userResources = require('../lib/userResources')
const asyncResources = require('../lib/asyncResources')
const authResources = require('../lib/authResources')

module.exports = {
    async index(req, res, next) {
      let token = req.body.token || decodeURI(req.query.token) || req.headers.Authorization
      
      try {
          let verify = await authResources.tokenVerify(token)
          if(!verify || verify.cp_id == undefined){
            res.status(401).send('Auth fail')
            return
          }
          let users = await userResources.getCpUsers(verify.cp_id)
          res.status(200).json(users)
        } catch (e) {
          //next(e)
          res.status(401).send(e.message+' ! Please re-login.')
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
        res.status(400).send('Miss paramater')
        return
      }
      //Check user is exist?
      let dbUsers = await userResources.getUserByEmail(email)
      if(dbUsers.length == 0)
      {
        res.status(401).send('No Account')
        return
      }
      //Check auth
      let dbUser = dbUsers[0];
      let isPass = await authResources.getCompare(password, dbUser.password)
      if(!isPass)
      {
        res.status(401).send('Auth fail')
        return
      }
      //Get Token
      if(dbUser) {
          delete dbUser.password
          delete dbUser.created_at
          delete dbUser.updated_at 
      }
          
      dbUser.remember_token = await authResources.getToken(dbUser);
      console.log(dbUser);
      res.status(200).json(dbUser)
    } catch (e) {
      next(e)
    }
  },

  async register(req, res, next) {
    try {
      //Get input data
      let token = req.body.token || decodeURI(req.query.token) || req.headers.Authorization
      let name = req.body.name || req.query.name
      let email = req.body.email || req.query.email
      let password = req.body.password || req.query.password
      let cp_id = req.body.cpId || req.query.cpId
      //Check input data
      if(name == undefined || email == undefined || password == undefined)
      {
        res.status(400).send('Miss paramater')
        return
      }
      let hashCode = await authResources.getHashCode(password)
      let myHash = hashCode.replace('$2b$', '$2y$');
      let obj = {
        name: name,
        email: email,
        password: myHash,
        role_id: 4,
        created_at: new Date(),
        updated_at: new Date()
      }
      //For admin to add user
      if(token !== 'undefined') {
        let verify = await authResources.tokenVerify(token)
        if(verify.role_id<3) {//admin
          obj['cp_id'] = verify.cp_id
          obj['email_verified_at'] = new Date()
        }
      } else {
        if(cp_id === undefined || cp_id === null )
        {
          cp_id = 1
        }
        obj['cp_id'] = cp_id 
      }
      
      let newUser = await userResources.createUser(obj)
      res.status(200).json(newUser)
    } catch (e) {
      next(e)
    }
  },

  async putResource(req, res, next) {
    try {
      let resource = {
        firstName: "Dennis",
        lastName: "Ritchie"
      }
      resource = await asyncResources.updateAsyncResource(resource)
      res.status(200).send(resource)
    } catch (e) {
      next(e)
    }
  },

  async deleteResource(req, res, next) {
    try {
      let resource = {
        firstName: "Dennis",
        lastName: "Ritchie"
      }
      resource = await asyncResources.deleteAsyncResources(resource)
      res.status(200).send(resource)
    } catch (e) {
      next(e)
    }
  }

}
