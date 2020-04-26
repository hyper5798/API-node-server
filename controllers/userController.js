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

  async postResource(req, res, next) {
    try {
      let resource = {
        firstName: "Dennis",
        lastName: "Ritchie"
      }
      resource = await asyncResources.createAysncResource(resource)
      res.status(201).send(resource)
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
