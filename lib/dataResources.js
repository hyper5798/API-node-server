/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict';

const test = true

module.exports = {
   async getMembers(user_id) {
      let user = await this.getTeamUser(user_id)
      if(user === null) return null
      let members = await this.getTeamUsers(user.team_id)
      let obj = {team_id: user.team_id}
      let arr = []
      members.forEach(function(item){
        arr.push(item.user_id)
      });
      obj.members = arr
      return obj
   },
   async getGroupScript(roomId) {
    let slist = await this.getScripts(roomId, null)
    let sObj = {}
    //Group by mission id
    for(let i=0;i<slist.length;i++) {
      let item = slist[i]
      if(sObj[item.mission_id] === undefined) {
        sObj[item.mission_id] = []
      }
      sObj[item.mission_id].push(item)
    }
    return sObj
  },

  async getDefaultScript(roomId, missionId) {
    let slist = await this.getScripts(roomId, missionId)
    return slist
  },
 

    getTeamUser(user_id) {
      const Team_user = require('../db/models').team_user
      return new Promise((resolve) => {
        resolve(Team_user.findOne({
          where: { "user_id": user_id },
          attributes: ['id','team_id', 'user_id']
        }))
      })
    },

    getTeamUsers(team_id) {
      const Team_user = require('../db/models').team_user
      return new Promise((resolve) => {
        resolve(Team_user.findAll({
          where: { 
            "team_id": team_id
          },
          attributes: ['id','team_id','user_id','room_id'] 
        }))
      })
    },
    getRooms() {
      const Room = require('../db/models').room
      return new Promise((resolve) => {
        resolve(Room.findAll())
      })
    },
    getRoom(room_id) {
      const Room = require('../db/models').room
      return new Promise((resolve) => {
        resolve(Room.findOne({
          where: { 
            "id": room_id
          },
          attributes: ['id','room_name','pass_time']
        }))
      })
    },
    getMissions(_roomId, _sequence) {
      const Mission = require('../db/models').mission
      let _obj = { "room_id": _roomId}
      if(_sequence != null)
        _obj['sequence'] = _sequence
      return new Promise((resolve) => {
        resolve(Mission.findAll({
          where: _obj,
          order: [
              ['sequence', 'ASC']
          ],
          attributes: ['id','mission_name','sequence','macAddr']
        }))
      })
    },
    getMissionByMac(_mac) {
      const Mission = require('../db/models').mission
      return new Promise((resolve) => {
        resolve(Mission.findOne({
          where: { 
            "macAddr": _mac
          },
          attributes: ['id','room_id','mission_name','sequence','macAddr']
        }))
      })
    },
    getScripts(_roomId, _missionId) {
      // return User.findAll()
      let _obj = { "room_id": _roomId}
      if(_missionId)
        _obj['mission_id'] = _missionId

      return new Promise((resolve) => {
        const Script = require('../db/models').script
        resolve(Script.findAll({
          where: _obj,
          attributes: ['id','script_name','mission_id','content','prompt1','prompt2','prompt3','pass','next_pass','next_sequence','note'] 
        }))
      })
    },
    getSecurityNode(room_id) {
      const Device = require('../db/models').device
      return new Promise((resolve) => {
        resolve(Device.findAll({
          where: { 
            "setting_id": room_id,
            "type_id": 98
          },
          attributes: ['id','macAddr']
        }))
      })
    },
    createRecord(mobj) {
      const Record = require('../db/models').record
      let obj = {
        "team_id": mobj.team_id,
        "room_id": mobj.room_id,
        "mission_id": mobj.mission_id,
        "team_record_id": mobj.team_record_id,
        "start_at": mobj.start,
        "end_at": mobj.end,
        "time": mobj.time,
        "created_at": new Date(),
        "updated_at": new Date()
      }
      return new Promise((resolve) => {
        resolve(Record.create(obj))
      })
    },
    createTeamRecord(mobj) {
      const TeamRecord = require('../db/models').team_record
      let obj = {
        "team_id": mobj.team_id,
        "room_id": mobj.room_id,
        "cp_id": mobj.cp_id,
        "total_time": mobj.total_time,
        "reduce": mobj.reduce,
        "status": mobj.status,
        "sequence": mobj.sequence,
        "start": mobj.start,
        "end": mobj.end
      }
      return new Promise((resolve) => {
        resolve(TeamRecord.create(obj))
      })
    },
    updateRecord(id, attributes) {
      const Record = require('../db/models').record
      return new Promise((resolve) => {
        resolve(Record.update(
          /* set attributes' value */
          attributes,
          /* condition for find*/
          { where: { "id": id }}
        ))
      })
    },
    getTeam(team_id) {
      const Team = require('../db/models').team
      return new Promise((resolve) => {
        resolve(Team.findOne({
          where: { "id": team_id },
          attributes: ['id','name', 'cp_id']
        }))
      })
    },
    getRandomScript(list) {
      //console.log(list)
      if(list === undefined) {
        return null
      }
      let num = this.getRandom(list.length)
    
      //console.log('getScript number = ',num)
      return list[num]
    },
    getRandom(x){
      return Math.floor(Math.random()*x);
    },
    showLog(message, show) {
      if(show || test)
        //console.log(message + ' >>> '+ new Date().toISOString())
        console.log( new Date().toISOString()+ ' >>> '+ message)
        //file.appendToFile(logPath, message)
    },
    showError(message) {
      if(test) {
        const file = require('../modules/fileTools')
        let errorPath = './doc/log/error.txt';
        file.appendToFile(errorPath, message)
      }
        
    },
    saveReport(obj) { 
      const Report = require('../db/models').report
      let newObj = getDbObj(obj)
      return new Promise((resolve) => {
        resolve(Report.create(newObj))
      })
    }
}

function getDbObj(_Obj) {
  try {
    let jsonObj = JSON.parse(JSON.stringify(_Obj))
    jsonObj['type_id'] = parseInt(jsonObj.fport)
    delete jsonObj.fport
    jsonObj['extra'] = {}
    if(jsonObj.frameCnt !== undefined){
        jsonObj.extra['frameCnt'] = jsonObj.frameCnt
        delete jsonObj.frameCnt
    } else {
        jsonObj.extra = null
    } 
    if(jsonObj.extra != null)
      jsonObj.extra = JSON.stringify(jsonObj.extra)
    
    let keys = Object.keys(jsonObj.data)
    for(let i=0;i<keys.length;i++) {
      jsonObj[keys[i]] = jsonObj.data[keys[i]]
    }
    delete jsonObj.data
    if(jsonObj.recv === undefined ||jsonObj.recv === null)
      jsonObj.recv = new Date().toISOString()
    //console.log('save jsonObj :')
    //console.log(jsonObj)
    return jsonObj
  } catch (error) {
      return error
  }
}
