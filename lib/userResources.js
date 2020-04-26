/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict';
const User = require('../db/models').User

module.exports = {

    getAllUser() {
      return User.findAll()
    },

    getCpUsers(cpId) {
      return User.findAll({
        where: {
            cp_id: cpId
        },
        raw: true
      })
    },

    getUserByEmail(email) {
      return User.findAll({
        where: {
            email: email
        },
        raw: true
      })
    },

    createUser(user) {
      return (resolve) => {
        resolve( User.create(user))
      }
    }
}
