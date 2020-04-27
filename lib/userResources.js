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
      return User.create(user)
    },

    updateBId(id, attributes) {
      return User.update(
        /* set attributes' value */
        attributes,
        /* condition for find*/
        { where: { id: id }}
      )
    },

    deleteById(userId) {
      return User.destroy({
        where: {
            id:userId
        }
      })
    },

    deleteById2(userId, cpId) {
      return User.destroy({
        where: {
            id:userId,
            cp_id: cpId
        }
      })
    }
}
