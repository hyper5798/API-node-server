/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict';
const Team = require('../db/models').team
const Team_user = require('../db/models').team_user
const Room = require('../db/models').room
const Mission = require('../db/models').mission
const Script = require('../db/models').script

module.exports = {

    getTeam(user_id) {
      // return User.findAll()
      return new Promise((resolve) => {
        resolve(Team_user.findOne({
          where: { "user_id": user_id } 
        }))
      })
    },

    getTeamUsers(team_id) {
      // return User.findAll()
      return new Promise((resolve) => {
        resolve(Team_user.findAll({
          where: { 
            "team_id": team_id
          } 
        }))
      })
    },
    getRoom(room_id) {
      // return User.findAll()
      return new Promise((resolve) => {
        resolve(Room.findOne({
          where: { 
            "id": room_id
          }
        }))
      })
    },
    getMissions(room_id) {
      // return User.findAll()
      return new Promise((resolve) => {
        resolve(Mission.findAll({
          where: { 
            "room_id": room_id
            },
          order: [
              ['sequence', 'ASC']
          ]
        }))
      })
    },
    getScripts(room_id) {
      // return User.findAll()
      return new Promise((resolve) => {
        resolve(Script.findAll({
          where: { 
            "room_id": room_id
          }
        }))
      })
    },
    getRoomTest(room_id, callback) {
      // return User.findAll()
      return callback(Room.findOne({
        where: { 
          "id": room_id
        }
      }))
    },
}
