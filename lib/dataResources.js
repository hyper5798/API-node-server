/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict';
const Team = require('../db/models').team
const Team_user = require('../db/models').team_user
const Room = require('../db/models').room
const Mission = require('../db/models').mission
const Script = require('../db/models').script
const Record = require('../db/models').record

module.exports = {

    getTeam(user_id) {
      // return User.findAll()
      return new Promise((resolve) => {
        resolve(Team_user.findOne({
          where: { "user_id": user_id },
          attributes: ['id','team_id', 'user_id']
        }))
      })
    },

    getTeamUsers(team_id) {
      // return User.findAll()
      return new Promise((resolve) => {
        resolve(Team_user.findAll({
          where: { 
            "team_id": team_id
          },
          attributes: ['id','team_id','user_id','room_id'] 
        }))
      })
    },
    getRoom(room_id) {
      // return User.findAll()
      return new Promise((resolve) => {
        resolve(Room.findOne({
          where: { 
            "id": room_id
          },
          attributes: ['id','room_name','pass_time']
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
          ],
          attributes: ['id','mission_name','sequence','macAddr']
        }))
      })
    },
    getScripts(room_id) {
      // return User.findAll()
      return new Promise((resolve) => {
        resolve(Script.findAll({
          where: { 
            "room_id": room_id
          },
          attributes: ['id','script_name','mission_id','content','prompt','pass'] 
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
    createRecord(mobj) {
      let obj = {
        "team_id": mobj.team_id,
        "room_id": mobj.room_id,
        "mission_id": mobj.mission_id,
        "start_at": mobj.start,
        "end_at": mobj.end,
        "time": mobj.time,
        "created_at": new Date(),
        "updated_at": new Date()
      }
      return new Promise((resolve) => {
        resolve(Record.create(obj))
      })
    }
}
