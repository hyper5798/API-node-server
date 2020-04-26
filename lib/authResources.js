/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict';
const userResources = require('../lib/userResources')
const config = require('../config/app.json')
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

    getToken(dbUser) {
         
      return jwt.sign(dbUser, config.secret, {
						expiresIn: 60*60*24
					});
    },

    createUser(obj) {
      return (resolve) => {
        resolve( User.create(user))
      }
    }
}