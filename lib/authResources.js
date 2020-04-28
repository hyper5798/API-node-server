/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict';
const userResources = require('../lib/userResources')
const appConfig = require('../config/app.json')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const saltRounds = 10

module.exports = {
    /**
     * @param pwd       The data to be encrypted.
     * @param hashPwd   The data to be replace laravel format and compared against.
     * @return          A promise to be either resolved with the comparision result salt or rejected with an Error
     */
    getCompare(pwd, hashPwd) {
      if(hashPwd === undefined || hashPwd === null){
        return false
      }
      hashPwd = hashPwd.replace('$2y$', '$2b$');
      return bcrypt.compare(pwd, hashPwd)
    },

    getInputToken(req) {
      let token = req.query.token
      if(token != undefined)
          token = decodeURI(req.query.token)
      else
        token = req.headers.authorization || req.body.token
      return token
    },

    getToken(dbUser) {
         
      return jwt.sign(dbUser, appConfig.secret, {
						expiresIn: 60*60*appConfig.token_expired
					});
    },

    tokenVerify(token) {
      if(token.includes('Bearer'))
        token = token.replace('Bearer ', '');
      let  test = jwt.verify(token, appConfig.secret)
      return test
    },

    getHashCode(pwd) {
      return  bcrypt.hash(pwd, saltRounds)
    }
}