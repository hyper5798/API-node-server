/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict';
const User = require('../db/models').user

module.exports = {

    getAllUser() {
      // return User.findAll()
      return new Promise((resolve) => {
        resolve(User.findAll())
      })
    },

    getUserById(userId) {
      /*return User.findAll({
        where: {
            "id":userId
        }
      })*/
      return new Promise((resolve) => {
        resolve(User.findAll({
          where: {
              "id":userId
          }
        }))
      })
    },

    getCpUsers(cpId) {
      /*return User.findAll({
         where: {
             "cp_id": cpId
         },
         raw: true
      })*/
      return new Promise((resolve) => {
        resolve(User.findAll({
          where: {
              "cp_id": cpId
          },
          raw: true
        }))
      })
    },

    getUserByEmail(email) {
      /*return User.findAll({
        where: {
            "email": email
        },
        raw: true
      })*/
      return new Promise((resolve) => {
        resolve(User.findAll({
          where: {
              "email": email
          },
          raw: true
        }))
      })
    },

    createUser(user) {
      //return User.create(user)
      return new Promise((resolve) => {
        resolve(User.create(user))
      })
    },

    updateBId(id, attributes) {
      /*return User.update(
        attributes,
        { where: { "id": id }}
      )*/
      return new Promise((resolve) => {
        resolve(User.update(
          /* set attributes' value */
          attributes,
          /* condition for find*/
          { where: { "id": id }}
        ))
      })
    },

    destroyById(userId) {
       /*return User.destroy({
        where: {
            "id":userId
        }
      })*/
      return new Promise((resolve) => {//For super admin
        resolve(User.destroy({
          where: {
              "id":userId
          }
        }))
      })
    },

    destroyById2(userId, cpId) {//For admin
      /*return User.destroy({
        where: {
            "id":userId,
            "cp_id": cpId
        }
      })*/
      return new Promise((resolve) => {
        resolve(User.destroy({
          where: {
              "id":userId,
              "cp_id": cpId
          }
        }))
      })
    }
}
