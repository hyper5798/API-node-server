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
      //return bcrypt.compare(pwd, hashPwd)
      return new Promise((resolve) => {
        hashPwd = hashPwd.replace('$2y$', '$2b$');
        resolve(bcrypt.compare(pwd, hashPwd))
      })
    },

    getInputToken(req) {
      let token =  req.headers["x-access-token"] || req.headers["authorization"]; req.body.token 
      if(token == undefined){
        token = req.query.token
        if(token != undefined)
          token = decodeURI(req.query.token)
      } else {
        if(token.includes('Bearer'))
          token = token.replace('Bearer ', '');
      }
      //return token
      return token
    },

    getToken(dbUser) {
         
      /*return jwt.sign(dbUser, appConfig.secret, {
						expiresIn: 60*60*appConfig.token_expired
          });*/
      return new Promise((resolve) => {
        resolve(jwt.sign(dbUser, appConfig.secret, {
          expiresIn: 60*60*appConfig.token_expired
        }))
      })
    },

    tokenVerify(token) {
      // let  test = jwt.verify(token, appConfig.secret)
      // return test
      return new Promise((resolve,reject) => {
        jwt.verify(token, appConfig.secret,function(err,result){
          if (err) {
            
            console.log(err);
            if(err.message === 'jwt expired') {
              resolve('expired');
            } else {
              resolve(null); // or use rejcet(false) but then you will have to handle errors
            }
          } 
          else {
            console.log('token parse: ' + result);
            resolve(result);
          }
        })
      })
    },

    getHashCode(pwd) {
      // return  bcrypt.hash(pwd, saltRounds)
      return new Promise((resolve) => {
        resolve(bcrypt.hash(pwd, saltRounds))
      })
    }
}