'use strict'

/*!
 * Module dependencies
 */

//const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const dataResources = require('../lib/dataResources')
const file = require('../modules/fileTools')
const code = require('../doc/setting/code.json')
let roomPath = './doc/room/room'
const interval = 500

//Socket client ----------------------------------------------------
const appConfig = require('../config/app.json')
let wsUrl ='http://localhost:'+appConfig.port
const io = require('socket.io-client')
const socket = io.connect(wsUrl, {reconnect: true})

socket.on('connect',function(){
  socket.emit('mqtt_sub','**** escape controller socket cient is ready');
});

socket.on('disconnect',function(){
  console.log('escape controller websocket disconnct');
  if (socket.connected === false ) {
    //socket.close()
    socket.open();
  }
});

socket.on('news',function(m){
  console.log('escape controller receve websocket :'+m);
});

//Receive server socket boardcast : mqtt upload
socket.on('update_mqtt_ul',function(data){
  console.log('escapeController update_mqtt_ul :'+ data.key1);
  switchMqttCmd(data)
});

socket.on('change_mode',function(data){

  console.log('escapeController change_mode :'+ data.mode);
  if( (data.token === undefined || data.token === null) ) {
    if(!global.test)
      return
  }
  switchMode(data.room_id, data.mode, data.token)
});

module.exports = {
    /**
     * 取得大門任務
     *
     * @param int room_id
     * @return mission
     */
    async getDefaultMission(req, res, next) { 
      console.log(getLogTime()+'getDefaultMission -------------------')
      let input = checkInput(req, ['room_id'])
      
      if(input === null) {
        return missParam(res, 'getDefaultMission', 'miss param')
      }
      const redisHandler  = require('../modules/redisHandler')
      const redisClient = new redisHandler(0)
      redisClient.connect()

      try {
        const room_id = input.room_id
        const roomkey = 'room'+room_id
        
        let mission = await redisClient.hgetValue(roomkey, 'door_mission')
        if(mission !== null) {
          mission = JSON.parse(mission)
        } else {
          mission = await toGetDefaultMission(room_id)
          redisClient.hsetValue(roomkey, 'door_mission', JSON.stringify(mission))
        }
        
        redisClient.quit()
        console.log(getLogTime()+'getDefaultMission response 200')
        resResources.getDtaSuccess(res, mission)
      } catch (error) {

        redisClient.quit()
        console.log(getLogTime()+'getDefaultMission response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    async sendMqttCmd(req, res, next) {
      console.log(getLogTime()+'sendMqttCmd -------------------')
      
      let input = checkInput(req, ['room_id','macAddr','command'])
        
      if(input === null) {
        return missParam(res, 'sendMqttCmd', 'miss param')
      }
      const redisHandler  = require('../modules/redisHandler')
      const redisClient = new redisHandler(0)


      try {
        redisClient.connect()
        let receiveTime = new Date().toISOString()
        
        const room_id = parseInt(input.room_id)
        let macAddr = input.macAddr
        let command = parseInt(input.command)
        //console.log('mac:'+macAddr+', command:'+command)
        let script = null;
        if(command === code.set_controller_command) {
          script = req.body['script'] || req.query['script']
          script = JSON.parse(script)
        }

        if(macAddr === 'default') {
          toLog('2','command: default')
          let roomKey = 'room'+room_id
          let path = roomPath+room_id+'.json'
          let roomObj = file.getJsonFromFile(path)       
          let team_id = await redisClient.hgetValue(roomKey, 'team_id')
          
          if(team_id != null) {
            team_id = parseInt(team_id)
            if(team_id > 0) {
              toLog('3','Door has be opened by the other team')
              redisClient.quit()
              return notAllowed(res, 'sendMqttCmd default', 'Door has be opened by the other team')
            }
          }
          
          let user_id = req.body.user_id || req.query.user_id

          if(user_id === undefined || user_id === null) {
            redisClient.quit()
            return missParam(res, 'sendMqttCmd', 'miss param user_id')
          }

          toLog(2,'befor get teamMember')
          let teamUser = await dataResources.getTeamUser(user_id)
          toLog(2,'after get teamMember')

          if(teamUser === null) {
            toLog('3','Not join team')
            redisClient.quit()
            return notAllowed(res, 'sendMqttCmd default', 'Not join team')
          }

          //Get missions from db
          toLog(3,'befor get default mission')
          let _missions = await dataResources.getMissions(room_id, 0)
          toLog(3,'after get default mission : '+ _missions.length)
          
          if(_missions.length == 0) {
            redisClient.quit()
            return notFound(res, 'sendMqttCmd','Not found default mission' )
          }
          
          let m = _missions[0]
          macAddr = m.macAddr
          
          if(macAddr === undefined || macAddr === null) {
            redisClient.quit()
            return notFound(res, 'sendMqttCmd','Not found default device' )
          }

          //Record door status
          let door = code.door_off_notify//10//11
          
          if(command === code.node_on_command) {//21
            door = code.door_on_notify//11
          } else if(command === code.node_off_command){//20
            door = code.door_off_notify//10
          }
          
          //redisClient.hsetValue(macAddr,'door', status)
          redisClient.hsetValue(macAddr,'room_id',room_id)
          
          saveRoom(redisClient,roomObj,{
            roomId:room_id,
            sequence:0,
            doorMac:macAddr,
            status:0,
            door: door,
            team_id:teamUser.team_id,
            team_backup:teamUser.team_id,
            reduce:0,
            prompt:0,
            start: '',
            end: ''
          })
          
          redisClient.quit()
        } else {
          //判斷是否有此裝置
        }
        console.log(getLogTime()+'sendMqtt mac: '+ macAddr+ ',command:'+command)
        
        //Send MQTT command to node
  
        let cmdObj = getMqttObject( macAddr, command, receiveTime, 1, script)
        sendMqttMessage(socket, cmdObj)//To server.js mqtt client send message
        
		    console.log(getLogTime()+'sendMqttCmd response 200')
        resResources.doSuccess(res, 'Send mqtt command ok')
      } catch (error) {
        toLog(4,'@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    async setMissionAction(req, res, next) {
      
      const actionTime = new Date().toISOString()
      console.log(getLogTime()+'setMissionAction -------------------')
      let input = checkInput(req, ['room_id', 'user_id'])
      
      if(input === null) {
        missParam(res, 'setMissionAction', 'miss param')
      }
      
      //let user_id = parseInt(input.user_id)
      let room_id = input.room_id
      let user_id = parseInt(input.user_id)
      console.log('room_id:'+room_id+', user_id:'+user_id)
      let roomKey = 'room'+room_id
      let path = roomPath+room_id+'.json'
      let roomObj = file.getJsonFromFile(path)
      //Connect redis
      const redisHandler  = require('../modules/redisHandler')
      const redisClient = new redisHandler(0)
      redisClient.connect()
        
      try {
        //Jason test bypass
        //let currentSequence = await redisClient.hgetValue(roomKey, 'sequence')
        
        let mode = await redisClient.hgetValue(roomKey, 'mode')
        let status = await redisClient.hgetValue(roomKey, 'status')
        let door = await redisClient.hgetValue(roomKey, 'door')
        let missions = await redisClient.hgetValue(roomKey, 'missions')
        mode = mode ? parseInt(mode) : 30;
        
        if(mode === code.security_mode_command) {
          redisClient.quit()
          notAllowed(res, 'setMissionAction', 'Security mode')
        }
        let doorMac = await redisClient.hgetValue(roomKey, 'doorMac')
		    
        if(door === null) {
          if(roomObj)
            //currentSequence = roomObj['sequence']
            door = roomObj['door']
        } else {
          //currentSequence = parseInt(currentSequence)
          door = parseInt(door)
        }
        
        if(door === code.door_on_notify){
          //未關大門 ------------------------------------------------
          toLog('','@@ Door open')
          notAcceptable(res, 'setMissionAction', 'Door open')
          redisClient.quit()
          return
        } 

        if(status === code.mission_start || status === code.mission_end) {
          //已開始闖關,重複發出命令----------------------------------
          toLog('','@@ Already acted')
          notAllowed(res, 'setMissionAction', 'Already acted')
          redisClient.quit()
          return
        } else if(status === code.emergency_stop) {
          //進入大門尚未闖關按下緊急按紐------------------------------
          setRoomDefault(redisClient, room_id ,doorMac)
          toLog('','@@ Emergency door open')
          conflict(res, 'setMissionAction', 'Emergency door open')
          redisClient.quit()
          return
        }

        const obj = await dataResources.getMembers(user_id)
        toLog(2,'get members')
		    
        if(obj === null) {
          toLog('','@@ Not join team')
          redisClient.quit()
          return notAllowed(res, 'setMissionAction','Not join team')
        }
        console.log('team_id:'+obj.team_id)
        console.log('member:'+JSON.stringify(obj.members))
        // let teamId = obj.team_id
        let members = obj.members

        //Get room
        let room = await dataResources.getRoom(room_id)
        toLog(3,'get room:'+room.room_name)
		    
        if(room === null ) {
          redisClient.quit()
          return notFound(res, 'setMissionAction', 'Not found room')
        }
        //Get missions
        /*let mList = await dataResources.getMissions(room_id, null)
		    toLog(4,'get mission :'+mList.length)
        
        if(mList === null || mList.length === 0 ) {
          redisClient.quit()
          return notFound(res, 'setMissionAction', 'Not found mission '+ mList.length)
        }

        let scriptGroup = await dataResources.getGroupScript(room_id)
        toLog(5, 'getGroupScript '+Object.keys(scriptGroup).length)
        if(Object.keys(scriptGroup).length === 0 ) {
          redisClient.quit()
          return notFound(res, 'setMissionAction','Not found script')
        }
        
        let defaultIndex = -1
        for(let i=0;i<mList.length;i++) {
          //Jason add for clear mac in redis on 2020.11.18
          redisClient.remove(mList[i])
          if(mList[i].sequence ===0){
            defaultIndex = i
            break
          }
        }
    
        let macList = []
        let inx = 0
        let lists = JSON.parse(JSON.stringify(mList))
        let changePass = {}
        if(defaultIndex > -1) 
          lists.splice(defaultIndex, 1);
        toLog(6,'save mission redis and random script')
        for(let i=0;i<lists.length;i++) {

          let mission = lists[i]
          //Filter emergency mac of room 
          if(mission.sequence === null || mission.sequence === 0) {//Mission 0 for emergency
            continue
          } 
          macList.splice(inx, 0 , mission.macAddr)
          inx++
          if(mission.sequence ===1) {
            
            //let test = await dataResources.saveReport(cmdObj)
            //toLog(9,'After save report')
           
            //code.mission_start_command 23: 啟動 node
            let startNodeObj = getMqttObject( mission.macAddr, code.mission_start_command, actionTime, 1)
            sendMqttMessage(socket, startNodeObj, 2*interval)
            
            initMacRedis(redisClient,mission.macAddr, room_id, mission.id,mission.sequence, actionTime )
          } else {
            initMacRedis(redisClient,mission.macAddr, room_id, mission.id, mission.sequence, null )
          }
          mission.script = getScript(scriptGroup[mission.id])
          if(mission.script.next_pass!==null && mission.script.next_sequence!==null) {
            changePass[mission.script.next_sequence] = mission.script.next_pass
            //Jason add relation between pass and next_pass on 2020.10.22
            mission.script.pass = mission.script.pass + ':' + mission.script.next_pass
          }
          if(changePass[mission.sequence]) {
            mission.script.pass = changePass[mission.sequence]
          }

          
          let time = new Date().toISOString()
          let passObj = getMqttObject( mission.macAddr, mission.script, time, 1)
          //MQTT pass 
          sendMqttMessage(socket, passObj, ((i)*interval))
        }
        
        //Save room to redis and file
        //Sende off command via MQTT for Close back boor 
        let sList = await dataResources.getSecurityNode(room_id)
        for(let i=0;i<sList.length;i++) {
          let time = new Date().toISOString()
          let device = sList[i]
          let closeObj = getMqttObject( device.macAddr, code.node_off_command, time, 1)
          // MQTT open back door
          sendMqttMessage(socket, closeObj, ((i)*interval))
        }*/
        if(missions)
          missions = JSON.parse(missions)
        for(let i=0;i<missions.length;i++) {
          
          let mission = missions[i]
          if(mission.sequence ===1) {
            let startNodeObj = getMqttObject( mission.macAddr, code.mission_start_command, actionTime, 1)
            sendMqttMessage(socket, startNodeObj, interval)
            initMacRedis(redisClient,mission.macAddr, room_id, mission.id,mission.sequence, actionTime )
          } else {
            initMacRedis(redisClient,mission.macAddr, room_id, mission.id, mission.sequence, null )
          }
        }
        saveRoom(redisClient,roomObj,{
          roomId:room_id,
          room:room,
          pass_time: room.pass_time,
          members:members,
          status:code.mission_start,
          sequence:1,
          start: actionTime,
          //missions: lists,
          //macs:macList,
          //count:macList.length,
        })

        redisClient.quit()
        let data = {"room":room, "members":members, "missions":missions}
        console.log(getLogTime()+'setMissionAction 200 OK')
        resResources.getDtaSuccess(res, data)
      } catch (error) {
        toLog(10,'@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    getMissionData(req, res, next) {
      
      let actionTime = new Date().toISOString()
      toLog(1,'getMissionData -------------------')
     
      try {
        let input = checkInput(req, ['room_id', 'user_id'])
      
        if(input === null) {
          return missParam(res, 'getMissionData', 'miss param')
        }
        //let user_id = parseInt(input.user_id)
        let room_id = parseInt(input.room_id)
        let user_id = parseInt(input.user_id)
        let roomKey = 'room'+room_id
        let path = roomPath+room_id+'.json'
        let roomObj = file.getJsonFromFile(path)
        
        if(roomObj === null) {
          return notAllowed(res, 'getMissionData', 'Mission not action yet')
        }
        
        let members = roomObj.members
        toLog(2,'member index :' +members.indexOf(user_id) )
        if(members.indexOf(user_id) < 0) {
          return notAllowed('getMissionData', 'Not in action team')
        }
        let data = {"room":roomObj.room, "members":roomObj.members, "missions":roomObj.missions }
        resResources.getDtaSuccess(res, data)
      } catch (error) {
        toLog(4,'response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    async setMissionStart(req, res, next) {
      
      toLog(1,'setMissionStart -------------------')
      try {
        
        let input = checkInput(req, ['room_id', 'sequence'])
      
        if(input === null) {
          return missParam(res, 'setMissionStart', 'miss param')
        }
        //let user_id = parseInt(input.user_id)
        let room_id = parseInt(input.room_id)
        let sequence = parseInt(input.sequence)
        let roomKey = 'room'+room_id
        let path = roomPath+room_id+'.json'
        let roomObj = file.getJsonFromFile(path)
        //Connect redis
        const redisHandler  = require('../modules/redisHandler')
        const redisClient = new redisHandler(0)
        redisClient.connect()
        
        let currentSequence = await redisClient.hgetValue(roomKey, 'sequence')
        let count = await redisClient.hgetValue(roomKey, 'count')
        let macs =  await redisClient.hgetValue(roomKey, 'macs')
       
        toLog(2,'get currentSequence, count , macs from redis')
        console.log('currentSequence:'+currentSequence+ ', count:'+count+', macs'+macs)
        if(currentSequence === null) {//Check redis value
          toLog('','@@ from redis null')
          
          currentSequence = roomObj['sequence']
          count = roomObj['count']
          macs = roomObj['macs']
        }

        if(typeof currentSequence === 'string') {
          currentSequence = parseInt(currentSequence)
          count = parseInt(count)
          macs = JSON.parse(macs)
        }

        if(currentSequence === null) {//Check status for
          toLog('','@@ from file null')
          redisClient.quit()
          return notAllowed(res, 'setMissionStart', 'Mission not action yet')
        }
        if(currentSequence !== (sequence-1) || sequence > count) {
          toLog('','@@ Not allowed sequence:'+sequence)
          redisClient.quit()
          return notAllowed(res, 'setMissionStart', 'Not allowed sequence')
        }
        let mac = macs[(currentSequence-1)]
        toLog(3,'mac1 :'+ mac)
        let end = await redisClient.hgetValue(mac, 'end')
        toLog(4,'mac1 end :'+ end)
        if(end === null) {
          toLog('','@@ Not complete previous mission')
          redisClient.quit()
          return notAllowed(res, 'setMissionStart', 'Not complete previous mission')
        }
        let mac2 = macs[(currentSequence)]
        toLog(5,'mac2 :'+ mac2)
        let start = await redisClient.hgetValue(mac2, 'start')
        toLog(6,'mac2 start:'+ start)
        if(start !== null && start !== '') {
          toLog('','@@ Repeat command')
          redisClient.quit()
          return notAllowed(res, 'setMissionStart', 'Repeat command')
        }
        toLog(7,'judge end')
        //setMissionStart update sequence, status,start time ------------------------------
        let startTime = new Date().toISOString()
        redisClient.hsetValue(mac2, 'start', startTime)
        //setMissionStart Save room to redis and file
        saveRoom(redisClient,roomObj,{
          roomId: room_id,
          status: code.mission_start,
          sequence: sequence,
          prompt: 0
        })
        
        //Set start node to web
        //let cmdObj = getMqttObject( mac2, 1, startTime, 1)
        let cmdObj = getMqttObject( mac2, code.mission_start, startTime, 1)
        //Send socket to web
        sendSocketCmd(socket, cmdObj)
        //Save node status 1 to DB
        toLog(7,'Before save report')
        let result = await dataResources.saveReport(cmdObj)
        toLog(7,'After save report')
        
        //MQTT Command 23: 啟動 node
        let startNodeObj = getMqttObject( mac2, code.mission_start_command, startTime, 1)
        sendMqttMessage(socket, startNodeObj, 0)
        
        if(result.id > 0) {
          toLog('','**** save report success')
        }
        redisClient.quit()
        toLog(8,'Response 200')
        let _msg = 'Set mission sequence '+sequence+' start ok'
        //resResources.doSuccess(res, 'Set mission start ok')
        resResources.doSuccess(res, _msg)
      } catch (error) {
        toLog(8,'@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    async setMissionEnd(req, res, next) {
      
      toLog(1,'setMissionEnd -------------------')
      try {
        let input = checkInput(req, ['room_id', 'sequence'])
      
        if(input === null) {
          toLog('','@@ miss param')
          return missParam(res, 'setMissionEnd', 'miss param')
        }
        //let user_id = parseInt(input.user_id)
        let room_id = parseInt(input.room_id)
        let sequence = parseInt(input.sequence)
        let roomKey = 'room'+room_id
        let path = roomPath+room_id+'.json'
        let roomObj = file.getJsonFromFile(path)
        //Connect redis
        const redisHandler  = require('../modules/redisHandler')
        const redisClient = new redisHandler(0)
        redisClient.connect()
        
        let currentSequence = await redisClient.hgetValue(roomKey, 'sequence')
        let count = await redisClient.hgetValue(roomKey, 'count')
        let macs =  await redisClient.hgetValue(roomKey, 'macs')
        toLog(2,'get sequence, count , macs from redis')
        console.log('currentSequence:'+currentSequence+ ', count:'+count+', macs'+macs)
        console.log(Object.keys(roomObj))
        if(currentSequence === null && Object.keys(roomObj)>0 ) {//Check redis value
          toLog('','@@ from redis null')
          currentSequence = roomObj['sequence']
          count = roomObj['count']
          macs = roomObj['macs']
        }

        if(typeof currentSequence === 'string') {
          currentSequence = parseInt(currentSequence)
          count = parseInt(count)
          macs = JSON.parse(macs)
        }

        if(currentSequence === null) {//Check status for
          toLog('','@@ from file null')
          redisClient.quit()
          return notAllowed(res, 'setMissionEnd', 'Mission not action yet')
        }
        if(currentSequence !== sequence || sequence > count) {
          toLog('','@@ Not allowed sequence :'+ sequence)
          redisClient.quit()
          return notAllowed(res, 'setMissionEnd', 'Not allowed sequence')
        }
        let mac = macs[(sequence-1)]
        toLog(3,'mac :'+ mac)
        let start = await redisClient.hgetValue(mac, 'start')
        toLog(4,'start :'+ start)
        if(start === null || start === '') {
          toLog('','@@ Not start mission')
          redisClient.quit()
          return notAllowed(res, 'setMissionEnd', 'Not start mission')
        }
        let end = await redisClient.hgetValue(mac, 'end')
        toLog(5,'end :'+ end)
        if(end !== null && end !== '') {
          toLog('','@@ Repeat command')
          redisClient.quit()
          return notAllowed(res, 'setMissionEnd', 'Repeat command')
        }
        let endTime = new Date().toISOString()
        /*if(true) {
          toLog(6,'Before save record')
          let result = await saveRecord(redisClient, room_id, mac, endTime)
          toLog(6,'After save record')
          redisClient.hsetValue(mac, 'record_id', result.id)
        }*/
        //setMissionEnd update status,end time ------------------------------
        
        redisClient.hsetValue(mac, 'end', endTime)

        saveRoom(redisClient,roomObj,{
          roomId: room_id,
          status: code.mission_end
        })

        redisClient.quit()
        
        //Set node end status to web
        //let cmdObj = getMqttObject( mac, 2, endTime, 1)
        let cmdObj = getMqttObject( mac, code.mission_end, endTime, 1)
        //Save node status 2 to DB
        toLog(7,'Before save report')
        let result = await dataResources.saveReport(cmdObj)
        toLog(7,'After save report')
        //Send socket to web
        sendSocketCmd(socket, cmdObj)
        
        //Send mqtt command 24 to Node
        let endNodeObj = getMqttObject( mac, code.mission_end_command, endTime, 1)
        sendMqttMessage(socket, endNodeObj, 0)
        
        
        if(result.id > 0) {
          toLog('','**** save report success')
        }
        toLog(8,'Response 200')
        let _msg = 'Set mission sequence '+sequence+' end ok'
        //resResources.doSuccess(res, 'Set mission end ok')
        resResources.doSuccess(res, _msg)
      } catch (error) {
        toLog(8,'@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    async getMissionStatus(req, res, next) {
      
      toLog(1,'getMissionStatus -------------------')
      try {
        
        let input = checkInput(req, ['room_id'])
      
        if(input === null) {
          toLog('','@@ miss param')
          return missParam(res, 'getMissionData', 'miss param')
        }
        //Connect redis
        const redisHandler  = require('../modules/redisHandler')
        const redisClient = new redisHandler(0)
        redisClient.connect()
        //let user_id = parseInt(input.user_id)
        let room_id = parseInt(input.room_id)
        let roomKey = 'room'+room_id
        let pass_time = 0
        let count = 0
        let start = null
        let data = {
          status: 0,
          sequence: 0,
          team_id: 0,
          door: 10,
          mode: 30,
          prompt: 0,
          reduce: 0,
          countdown: 0
        }
        
        let all = await redisClient.hgetall(roomKey)
        
        if(all !== null) {//Check redis value
          toLog(2,'get room data from redis')
          if(all.status)
            data.status = parseInt(all.status)

          if(all.sequence)
            data.sequence = parseInt(all.sequence)

          if(all.team_id)
            data.team_id = parseInt(all.team_id)

          if(all.reduce)
            data.reduce = parseInt(all.reduce)

          if(all.prompt)
            data.prompt = parseInt(all.prompt)

          if(all.mode)
            data.mode = parseInt(all.mode)
          
          if(all.door)
            data.door = parseInt(all.door)
          
          pass_time = parseInt(all.pass_time)
          start = all.start

        } else {
          toLog(2,'get room data from file')
          let path = roomPath+room_id+'.json'
          let roomObj = file.getJsonFromFile(path)

          data.status = roomObj['status']
          
          
          if(data.status === undefined || data.status === null){
            //Get status is null to reset to default
            data.status = 0
            setRoomDefault(redisClient, room_id ,null)
          } else {
            data.sequence = roomObj['sequence']
            data.team_id  = roomObj['team_id']
            data.reduce = roomObj['reduce']
            data.prompt = roomObj['prompt']
            data.mode = roomObj['mode']
          }
          

          //Jason add for restore data after redis loss on 2020.10.23
          if(data.sequence === 1 || data.sequence === 2) {
            count = roomObj['count']
            start = roomObj['start']
            pass_time = roomObj['pass_time']
          }
          
            
          if(data.mode === undefined || data.mode === null) {
            data.mode = 30
          }
          //Restore data from file to redis
          let obj = {
            roomId: room_id,
            status: data.status,
            sequence: data.sequence,
            prompt:data.prompt,
            reduce:data.reduce,
            team_id:data.team_id,
            mode:data.mode,
            count: count
          }

          if(roomObj.hasOwnProperty('end')) {
            obj.end = roomObj['end'];
          }

          if(roomObj.hasOwnProperty('start')) {
            obj.pass_time = roomObj['start'];
          }

          if(roomObj.hasOwnProperty('pass_time')) {
            obj.pass_time = roomObj['pass_time'];
          }

          if(roomObj.hasOwnProperty('missions')) {
            obj.missions = roomObj['missions'];
          }

          if(roomObj.hasOwnProperty('door_mission')) {
            obj.door_mission = roomObj['door_mission'];
          }

          if(roomObj.hasOwnProperty('members')) {
            obj.members = roomObj['members'];
          }

          if(roomObj.hasOwnProperty('macs')) {
            obj.macs = roomObj['macs'];
          }

          if(roomObj.hasOwnProperty('door')) {
            obj.door = roomObj['door'];
          }

          saveRoom(redisClient,roomObj,obj)
        }
        
        if((data.status === 1 || data.status === 2) && (data.sequence > 0)) {//During in pass mission
            let now = new Date().toISOString()
            if(start !== '') {
              let diff = getDiff(start, now)
              //toLog('','@@ get diff :'+diff)
              //Jason add for reduce on 2020.10.08
              if(typeof data.reduce === 'string') data.reduce = parseInt(data.reduce)
              if(typeof pass_time === 'string') data.reduce = parseInt(pass_time)
              
              data.countdown = pass_time - diff - data.reduce
              if(data.countdown == null) {
                console.log('Status countdown issue --------------------------------------')
                data.countdown = 0;
              }
              console.log('pass_time'+pass_time+', start:'+start+', diff:'+diff + ', reduce:'+data.reduce)
              if(data.countdown < 0) {
                data.countdown = 0
              }
              //toLog('', '@@ get countdown :'+data.countdown)
            }
        }
        
        console.log('get status:')
        console.log(data)

        redisClient.quit()
        
        toLog(3,'response 200')
        return resResources.getDtaSuccess(res, data)
      } catch (error) {
        toLog(5,'@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    setMissionPass(req, res, next) {
      toLog(1,'setMissionPass -------------------')
      setMissionStop(req, res, 3, 'Set mission pass ok')
      
    },

    setMissionFail(req, res, next) {
      toLog(1,'setMissionFail -------------------')
      setMissionStop(req, res, 4, 'Set mission fail ok')
      
    },

    setEmergencyStop(req, res, next) {
      toLog(1,'setEmergencyStop -------------------')
      setMissionStop(req, res, 6, 'Set emergency stop ok')
      
    },

    async setReduce(req, res, next) {
      try {
        toLog(1,'setReduce -------------------')
        
        let input = checkInput(req, ['room_id','prompt','time'])
        
        if(input === null) {
          return missParam(res, 'setReduce', 'miss param')
        }
        //Connect redis
        const redisHandler  = require('../modules/redisHandler')
        const redisClient = new redisHandler(0)
        redisClient.connect()
        //let user_id = parseInt(input.user_id)
        let room_id = input.room_id
        let roomKey = 'room'+room_id
        let prompt = input.prompt
        let time = input.time
        let path = roomPath+room_id+'.json'
        let roomObj = file.getJsonFromFile(path)
        let index = await redisClient.hgetValue(roomKey, 'prompt')
        if(prompt) prompt = parseInt(prompt)
        if(index) index = parseInt(index)
        if(prompt <= index) {
          redisClient.quit()
          return notAllowed(res, 'setReduce','Repeat command')
        }

        let reduce = await redisClient.hgetValue(roomKey, 'reduce')
        toLog(3,'get reduce from redis')
        if(reduce) 
          reduce = parseInt(reduce)
        else
          reduce = 0
        if(typeof time === 'string')
          time = parseInt(time)

        reduce = reduce + time
        //Save to redis
        toLog(3,'Save to redis')
        console.log('reduce:'+reduce+', prompt:'+reduce)
        //Save prompt, reducr to redis and file
        
        saveRoom(redisClient,roomObj,{
          roomId: room_id,
          reduce: reduce,
          prompt: prompt
        })
        //Send sock to web
        toLog(4,'Send sock to web')
        let now = new Date().toISOString
        let cmdObj = getMqttObject( 'reduce', time, now, 1)
        //Send socket to web
        sendSocketCmd(socket, cmdObj)
        redisClient.quit()
        toLog(5,'@@ response 200 ')
        resResources.doSuccess(res, 'Set reduce ok')
      } catch (error) {
        toLog(5,'@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    setMode(req, res, next) {
      try {
        toLog(1,'setMode -------------------')
        //let input = checkInput(req, ['room_id', 'user_id'])
        let input = checkInput(req, ['room_id'])
        let mode = req.params.mode
        if(input === null || mode === null) {
          return missParam(res, 'setMode', 'miss param')
        }
        //Connect redis
        const redisHandler  = require('../modules/redisHandler')
        const redisClient = new redisHandler(0)
        redisClient.connect()
        let room_id = input.room_id
        switchMode(room_id, mode, null )
        toLog('','@@ response 200 ')
        resResources.doSuccess(res, 'Set mode mode '+mode+' ok')
      } catch (error) {
        toLog('','@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }

    },

    resetStatus(req, res, next) {
      console.log(getLogTime()+'resetStatus -------------------')
      let input = checkInput(req, ['room_id'])
      
      if(input === null) {
        return missParam(res, 'resetStatus', 'miss param')
      }
      const redisHandler  = require('../modules/redisHandler')
      const redisClient = new redisHandler(0)

      try {
        //Connect redis
        
        redisClient.connect()
        let room_id = input.room_id
        setRoomDefault(redisClient, room_id ,null)
        redisClient.quit()
        console.log(getLogTime()+'resetStatus response 200 ')
        resResources.doSuccess(res, 'Reset status OK')
      } catch (error) {
        redisClient.quit()
        console.log(getLogTime()+'resetStatus response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
     

    },

    async gameTest(req, res, next) {
      console.log(getLogTime()+'gameTest -------------------')
      let input = checkInput(req, ['room_id','sequence'])
      
      if(input === null) {
        return missParam(res, 'resetStatus', 'miss param')
      }
      const redisHandler  = require('../modules/redisHandler')
      const redisClient = new redisHandler(0)

      try {
        //Connect redis
        redisClient.connect()
        let room_id = input.room_id
        let sequence = parseInt(input.sequence) 
        let roomKey = 'room'+room_id
        let path = roomPath+room_id+'.json'
        let roomObj = file.getJsonFromFile(path)
        let missions =  await redisClient.hgetValue(roomKey, 'missions')
        if(missions !== null) {
          missions = JSON.parse(missions)
          for(let i=0;i<missions.length;i++) {
            let time = new Date().toISOString()
            let mission = missions[i]
           
            //Remove mac data from redis
            if(mission.sequence === sequence) {
              let m = {}
              if(mission.script.pass.includes(':')) {
                m.pass = '3:03'
              } else {
                m.pass = '3'
              }
              let passObj = getMqttObject( mission.macAddr, m, time, 1)
              /*** MQTT node pass ***/
              sendMqttMessage(socket, passObj, 0)
              let startObj = getMqttObject( mission.macAddr, code.mission_start_command, time, 1)
              /*** MQTT node pass ***/
              sendMqttMessage(socket, startObj, 2*interval)
            }
          }
        }
        redisClient.quit()
        console.log(getLogTime()+'gameTest response 200 ')
        resResources.doSuccess(res, 'Game test start')
      } catch (error) {
        redisClient.quit()
        console.log(getLogTime()+'resetStatus response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
     

    },
}

async function  switchMode(_room_id, _mode, _token) {
  //Connect redis
  if(_token) {
    //From soket need check token
    const authResources = require('../lib/authResources')
    
    let result = await authResources.tokenVerify(_token)
    if(result === null) {
      return
    } else if(result === 'expired') {
      socket.emit('token_expire', {token: _token})
      return
    }
  }
  
  const redisHandler  = require('../modules/redisHandler')
  const redisClient = new redisHandler(0)
  redisClient.connect()
  console.log(getLogTime()+'switchMode -------------------')
  console.log('room_id:'+_room_id+', mode:'+_mode)
  
  
  let roomKey = 'room'+_room_id
  let path = roomPath+_room_id+'.json'
  let roomObj = file.getJsonFromFile(path)
  let team_backup = await redisClient.hgetValue(roomKey, 'team_backup')
  
  //Jason add replay command on 2020.12.31
  let actionTime = new Date().toISOString()
  //Web set standby command
  if(_mode===code.standby_command){
    console.log('1. standby_command')
    //Change door mission and clean status
    let door_mission = await toGetDefaultMission(_room_id)
    
    //Get missions
    let mList = await dataResources.getMissions(_room_id, null)
    if(mList)
      console.log('2. mission:'+mList.length)
    let scriptGroup = await dataResources.getGroupScript(_room_id)
    console.log('3. getGroupScript '+Object.keys(scriptGroup).length)

    let defaultIndex = -1
    for(let i=0;i<mList.length;i++) {
      //Jason add for clear mac in redis on 2020.11.18
      redisClient.remove(mList[i]['macAddr'])
      if(mList[i].sequence ===0){
        defaultIndex = i
        continue
      }
    }

    let macList = []
    let inx = 0
    let lists = JSON.parse(JSON.stringify(mList))
    let changePass = {}
    if(defaultIndex > -1) 
      lists.splice(defaultIndex, 1);
    console.log('4. save mission redis and random script')
    for(let i=0;i<lists.length;i++) {

      let mission = lists[i]
      //Filter emergency mac of room 
      if(mission.sequence === null || mission.sequence === 0) {//Mission 0 for emergency
        continue
      } 
      macList.splice(inx, 0 , mission.macAddr)
      inx++
      
      mission.script = getScript(scriptGroup[mission.id])
      if(mission.script.next_pass!==null && mission.script.next_sequence!==null) {
        changePass[mission.script.next_sequence] = mission.script.next_pass
        //Jason add relation between pass and next_pass on 2020.10.22
        mission.script.pass = mission.script.pass + ':' + mission.script.next_pass
      }
      if(changePass[mission.sequence]) {
        mission.script.pass = changePass[mission.sequence]
      }

      let time = new Date().toISOString()
      let passObj = getMqttObject( mission.macAddr, mission.script, time, 1)
      /*** MQTT pass ***/
      sendMqttMessage(socket, passObj, ((i)*interval))

      if(mission.sequence === 1) {
        let startNodeObj = getMqttObject( mission.macAddr, code.mission_start_command, time, 1)
        sendMqttMessage(socket, startNodeObj, 2*interval)
      }
    }

    let mac = list[0].macAddr
    let startNodeObj = getMqttObject( mac, code.mission_start_command, actionTime, 1)
    sendMqttMessage(socket, startNodeObj, 2*interval)

    saveRoom(redisClient,roomObj,{
      roomId:_room_id,
      sequence: 0,
      status: 0,
      reduce: 0,
      prompt: 0,
      security: 0,
      team_id: 0,
      door_mission: door_mission,
      missions: lists,
      macs:macList,
      count:macList.length,
      start: '',
      end: ''
    })

    redisClient.quit()
    return
  }
  //Web set replay command
  if(_mode===code.replay_command){
    let missions =  await redisClient.hgetValue(roomKey, 'missions')
    //Send pass via MQTT
    if(missions !== null) {
      missions = JSON.parse(missions)
      for(let i=0;i<missions.length;i++) {
        let time = new Date().toISOString()
        let mission = missions[i]
        let passObj = getMqttObject( mission.macAddr, mission.script, time, 1)
        /*** MQTT node pass ***/
        sendMqttMessage(socket, passObj, ((i)*interval))
        //Remove mac data from redis
        if(i===0) {
          initMacRedis(redisClient, mission.macAddr, _room_id, mission.id,mission.sequence, actionTime )
        } else {
          initMacRedis(redisClient, mission.macAddr, _room_id, mission.id, mission.sequence, null )
        }
      }
    }
    //Sende off command via MQTT for Close back boor 
    let sList = await dataResources.getSecurityNode(_room_id)
    for(let i=0;i<sList.length;i++) {
      let time = new Date().toISOString()
      let device = sList[i]
      let closeObj = getMqttObject( device.macAddr, code.node_off_command, time, 1)
      /*** MQTT open game door ***/
      sendMqttMessage(socket, closeObj, ((i)*interval))
    }
    let mac = missions[0].macAddr
    let startNodeObj = getMqttObject( mac, code.mission_start_command, actionTime, 1)
    sendMqttMessage(socket, startNodeObj, 2*interval)
    
    saveRoom(redisClient,roomObj,{
      roomId: _room_id,
      team_id: team_backup,
      mode: 30,
      sequence: 1,
      status: 1,
      prompt: 0,
      reduce: 0,
      start: actionTime,
      end: ''
    })

    redisClient.quit()
    return
  }
  
  //Reset command
  if(_mode===code.reset_command){
    
    let currentMode = await redisClient.hgetValue(roomKey, 'mode')
    let currentSecurity = await redisClient.hgetValue(roomKey, 'security')
    try {
      if(currentMode) {
        currentMode = parseInt(currentMode)
      } else {
        currentMode = 30
      }
      
      if(currentSecurity) {
        currentSecurity = parseInt(currentSecurity)
        
      } else {
        currentSecurity = 0
      }
    } catch (error) {
      console.log('error:'+error.message)
    }
    
    try {
      if(currentMode === code.security_mode_command && currentSecurity === code.security_event) {
        toLog(3, 'Security reset')
        saveRoom(redisClient,roomObj,{
          roomId:_room_id,
          security: 0
        })
        /*toLog(4,'Before get security nodes')
        let dList = await dataResources.getSecurityNode(_room_id)
        toLog(4,'After get security nodes :'+dList.length)
        let time = new Date().toISOString()
        for(let k=0;k<dList.length;k++) {
          let tmp = dList[k]
          
          //Send MQTT on command to security node
          let onObj = getMqttObject( tmp.macAddr, code.node_on_command, time, 1)
          sendMqttMessage(socket, onObj, ((k+1)*interval))
        }*/
      } else { //System reset
        //Save default wit mode to redis and file
        toLog(3, 'System reset')
        let door_mission = await toGetDefaultMission(_room_id)
        saveRoom(redisClient,roomObj,{
          roomId:_room_id,
          mode: code.game_mode_command,
          sequence: 0,
          status: 0,
          reduce: 0,
          prompt: 0,
          security: 0,
          team_id: 0,
          door_mission: door_mission,
          start: '',
        })
        
        //toLog(4,'Before get missions')
        let mList = await dataResources.getMissions(_room_id, null)
        toLog(4,'After get missions :'+mList.length)
        
        let time = new Date().toISOString()
        for(let k=0;k<mList.length;k++) {
          let tmp = mList[k]
          if(tmp.sequence===0) continue
          //Send MQTT reset command to node
          let resetObj = getMqttObject( tmp.macAddr, code.reset_command, time, 1)
          sendMqttMessage(socket, resetObj, ((k+1)*interval))
        }
  
        
        let dList = await dataResources.getSecurityNode(_room_id)
        toLog(5,'After get security nodes :'+dList.length)
        for(let k=0;k<dList.length;k++) {
          let tmp = dList[k]
          
          //Send MQTT on command to security node
          let onObj = getMqttObject( tmp.macAddr, code.node_off_command, time, 1)
          sendMqttMessage(socket, onObj, ((k+1)*interval))
        }
      }
    } catch (error) {
      console.log('error'+error.message)
    }
    
    redisClient.quit()
    return
  }
  let mode = null
  if(_mode===code.door_on_notify){
    
    try {
      console.log(getLogTime()+'switchMode open door')
      mode = await redisClient.hgetValue(roomKey, 'mode')

      let doorMac = await redisClient.hgetValue(roomKey, 'doorMac')
      if(doorMac===null) {
        doorMac = roomObj.doorMac
      }
      //Send open door MQTT command to node
      let receiveTime = new Date().toISOString()
      let onObj = getMqttObject( doorMac, code.node_on_command, receiveTime, 1)
      sendMqttMessage(socket, onObj)
    } catch (error) {
      toLog(3,'@@ error:'+error.message)
    }
    //Security mode only open door
    if(mode !== null) {
      mode = parseInt(mode)
    }

    //Security mode bypass node open
    if(mode === code.security_mode_command) {
      redisClient.quit()
      return
    }
    
    try {
      console.log(getLogTime()+'switchMode open node door')
      let macs = await redisClient.hgetValue(roomKey, 'macs')
      macs = JSON.parse(macs)
      for(let i=0;i<macs.length;i++) {
        let time = new Date().toISOString()
        let openObj = getMqttObject( macs[i], code.node_on_command, time, 1)
        /*** MQTT open game door ***/
        sendMqttMessage(socket, openObj, ((i)*interval))
      }
      //Sende on command via MQTT for open back boor
      let sList = await dataResources.getSecurityNode(_room_id)
      for(let i=0;i<sList.length;i++) {
        let time = new Date().toISOString()
        let device = sList[i]
        let openObj = getMqttObject( device.macAddr, code.node_on_command, time, 1)
        /*** MQTT open game door ***/
        sendMqttMessage(socket, openObj, ((i)*interval))
      }
      
    } catch (error) {
      toLog(4,'@@ error:'+error.message)
    }
    redisClient.quit()
    return
  }


  toLog(3,'Save mode to redis')
  let oldMode = await redisClient.hgetValue(roomKey,'mode')
  if(oldMode === null) {
    oldMode = code.game_mode_command
  } else {
    oldMode = parseInt(oldMode)
  }
  if(typeof _mode === 'string')
    _mode = parseInt(_mode)
  //Save mode to redis and file
  saveRoom(redisClient,roomObj,{
    roomId: _room_id,
    mode: _mode,
  })

  //Set send objec
  //Send sock to web
  toLog(4,'Send sock to web')
  let now = new Date().toISOString
  
  //Mode:30
  if(_mode===code.game_mode_command || _mode===code.demo_mode_command) {
    //Get missions
    let actionTime = new Date().toISOString
    toLog(5,'Before get mission')
    let mList = await dataResources.getMissions(_room_id, null)
    toLog(5,'After get mission :'+mList.length)
    
    for(let m=0;m<mList.length;m++) {
      
      let mission = mList[m]
      if(mission.sequence === 0) //Bypass default node
        continue
      let mObj = getMqttObject( mission.macAddr, _mode, actionTime, 1)
      // MQTT mode command 
      sendMqttMessage(socket, mObj, m*interval)
    }
    if(oldMode === code.security_mode_command) {
      //Send MQTT node_off_command to seurity node
      toLog(6,'Before get security device')
      let sList = await dataResources.getSecurityNode(_room_id)
      //let sList = await dataResources.getMissions(_room_id, null)
      toLog(6,'After get security device :'+sList.length)

      for(let n=0;n<sList.length;n++) {
      
        let device = sList[n]
        let nObj = getMqttObject( device.macAddr, code.game_mode_command, actionTime, 1)
        // MQTT secrity node off command 
        sendMqttMessage(socket, nObj, n*interval)
      }
    }
    
  } else if(_mode===code.security_mode_command){
    
    let actionTime = new Date().toISOString
    toLog(5,'Before get security device')
    let sList = await dataResources.getSecurityNode(_room_id)
    //let sList = await dataResources.getMissions(_room_id, null)
    toLog(5,'After get security device :'+sList.length)

    for(let n=0;n<sList.length;n++) {
    
      let device = sList[n]
      // MQTT secrity node on command 
      let nObj = getMqttObject( device.macAddr, code.security_mode_command, actionTime, 1)
      sendMqttMessage(socket, nObj, n*interval)
    }
  
  }
  redisClient.quit()
  
}

function setRoomDefault(client,roomId,mac) {
  
  let tmp = {roomId:roomId,sequence:0,doorMac:mac,status:0,team_id:0,reduce:0,prompt:0,start:'',end:'',door:10}
  saveRoom(client,null, tmp)
}

function saveRoom(_client,rObj, myJson) {
  let key = 'room' + myJson.roomId
  let path = roomPath+myJson.roomId+'.json'

  if(rObj === undefined || rObj === null) {
    rObj = {}
  }

  if(myJson.hasOwnProperty('door')) {
    _client.hsetValue(key, 'door', myJson.door)
    rObj.door = myJson.door
  }

  if(myJson.hasOwnProperty('mode')) {
    _client.hsetValue(key, 'mode', myJson.mode)
    rObj.mode = myJson.mode
  }
    
  if(myJson.hasOwnProperty('sequence')) {
    _client.hsetValue(key, 'sequence', myJson.sequence)
    rObj.sequence = myJson.sequence
  }
    
  if(myJson.hasOwnProperty('doorMac') && myJson.doorMac != null) {
    _client.hsetValue(key, 'doorMac', myJson.doorMac)
    rObj.doorMac = myJson.doorMac
  }
    
  if(myJson.hasOwnProperty('status')) {
    _client.hsetValue(key, 'status', myJson.status)
    rObj.status = myJson.status
  }
    
  if(myJson.hasOwnProperty('team_id')){
    _client.hsetValue(key, 'team_id', myJson.team_id)
    rObj.team_id = myJson.team_id
  }

  if(myJson.hasOwnProperty('team_backup')){
    _client.hsetValue(key, 'team_backup', myJson.team_backup)
  }
    
  if(myJson.hasOwnProperty('reduce')){
    _client.hsetValue(key, 'reduce', myJson.reduce)
    rObj.reduce = myJson.reduce
  }
    
  if(myJson.hasOwnProperty('prompt')){
    _client.hsetValue(key, 'prompt', myJson.prompt)
    rObj.prompt = myJson.prompt
  }
    
  if(myJson.hasOwnProperty('count')){
    _client.hsetValue(key, 'count', myJson.count)
    rObj.count = myJson.count
  }
    
  if(myJson.hasOwnProperty('macs')){
    _client.hsetValue(key, 'macs', JSON.stringify(myJson.macs))
    rObj.macs = myJson.macs
  }
    
  if(myJson.hasOwnProperty('start')){
    _client.hsetValue(key, 'start', myJson.start)
    rObj.start = myJson.start
  }
    
  if(myJson.hasOwnProperty('end')){
    _client.hsetValue(key, 'end', myJson.end)
    rObj.end = myJson.end
  }

  if(myJson.hasOwnProperty('pass_time')){
    _client.hsetValue(key, 'pass_time', myJson.pass_time)
    rObj.pass_time = myJson.pass_time
  }

  if(myJson.hasOwnProperty('security')){
    _client.hsetValue(key, 'security', myJson.security)
    rObj.security = myJson.security
  }

  if(myJson.hasOwnProperty('door_mission')){
    _client.hsetValue(key, 'door_mission', JSON.stringify(myJson.door_mission))
    rObj.door_mission = myJson.door_mission
  }

  if(myJson.hasOwnProperty('room')){
    //_client.hsetValue(key, 'room', myJson.room)
    rObj.room = myJson.room
  }

  if(myJson.hasOwnProperty('members')){
    _client.hsetValue(key, 'members', JSON.stringify(myJson.members))
    rObj.members = myJson.members
  }

  if(myJson.hasOwnProperty('missions')){
    _client.hsetValue(key, 'missions', JSON.stringify(myJson.missions))
    rObj.missions = myJson.missions
  }
  file.saveJsonToFile(path, rObj)
  
  if(global.debug) {
    console.log(getLogTime()+'saveRoom:\n'+JSON.stringify(myJson))
  }
}

async function setMissionStop(_req, _res, _status, _message) {
  try {
    
    let input = checkInput(_req, ['room_id'])
  
    if(input === null) {
      toLog('s1','@@ miss param')
      return missParam(_res, 'getMissionData', 'miss param')
    }
    let room_id = input.room_id
    let end = new Date().toISOString()
    toLog('s2','@@ end :'+ end)
    //Connect redis
    const redisHandler  = require('../modules/redisHandler')
    const redisClient = new redisHandler(0)
    redisClient.connect()

    let test = await toStopMssion(redisClient, room_id, _status, end)

    if(test === false) {//Check sequence
      toLog('s3','@@ Mission not action yet')
      redisClient.quit()
      return notAllowed(_res, 'setMissionStop', 'Mission not action yet')
    }
    redisClient.quit()
    toLog('s4','Response 200')
    resResources.doSuccess(_res, _message)
  } catch (error) {
    toLog('s4','@@ response 500 :'+error.message)
    resResources.catchError(_res, error.message)
  }
}

function checkInput(req, arr) {
  let result = {};
  try {
    arr.forEach(item => { 
      //console.log(item); 
      if(req.body[item] != undefined || req.query[item]!= undefined)
        result[item] = req.body[item] || req.query[item]
    }); 
    
    if(Object.values(result).length != arr.length) {
      //tolog('','@@ checkInput fail')
      return null
    } else {
      //toLog('','@@ checkInput')
      //console.log(result)
      return result
    }
      
  } catch (error) {
    dataResources.showError('@@ 1.checkInput :'+ error.message)
    return null
  }
}

function getScript(list) {
  //console.log(list)
  if(list === undefined) {
    return null
  }
  let num = getRandom(list.length)

  //console.log('getScript number = ',num)
  return JSON.parse(JSON.stringify(list[num]))
}

function getRandom(x){
  return Math.floor(Math.random()*x);
};

function sendSocketCmd(_socket, _obj) {
  //let msg_obj = getDbObj(_obj)
  //_socket.emit('socket_command', msg_obj)
  _socket.emit('socket_command', _obj)
}

function sendMqttCmd(_socket, msg_obj) {
  _socket.emit('mqtt_command', msg_obj)
}

function getMqttObject( _mac, _command, _time,_count,_script) {
  if(typeof _command === 'object') {
    //return {"macAddr":_mac,"pass":_command.value,"recv":_time,"fport":99,"frameCnt":_count}
    return {"macAddr":_mac,"pass":_command.pass,"recv":_time,"fport":99}
  } else if(_script !== undefined && _script !== null){
    //return {"macAddr":_mac,"data":{"key1":_command},"recv":_time,"fport":99,"frameCnt":_count}
    return {"macAddr":_mac,data:{"key1":93, "script":_script},"recv":_time,"fport":99}
  } else {
    //return {"macAddr":_mac,"data":{"key1":_command},"recv":_time,"fport":99,"frameCnt":_count}
    return {"macAddr":_mac,"data":{"key1":_command},"recv":_time,"fport":99}
  }
}

function notFound(_res, _target, _msg) {
  dataResources.showError(_target + ' -> '+ _msg)
  return resResources.notFound(_res, _msg)
}

function notAllowed(_res, _target, _msg) {
  dataResources.showError(_target + ' -> '+ _msg)
  return resResources.notAllowed(_res, _msg)
}

function notAcceptable(_res, _target, _msg) {
  dataResources.showError(_target + ' -> '+ _msg)
  return resResources.notAcceptable(_res, _msg)
}

function conflict(_res, _target, _msg) {
  dataResources.showError(_target + ' -> '+ _msg)
  return resResources.conflict(_res, _msg)
}

function missParam(_res, _target, _msg) {
  dataResources.showError(_target + ' -> '+ _msg)
  return resResources.missPara(_res, _msg)
}

function toLog(_num, _msg) {
  if(global.debug)
    dataResources.showLog('## '+_num+'. '+_msg)
}

function getLogTime() {
  return new Date().toISOString()+ ' >>> '
}

function initRoomRedis(_client,_room, _teamId, _members,_time, _macs) {
  let mkey = 'room'+_room.id
  _client.hsetValue(mkey, 'start', _time)
  _client.hsetValue(mkey, 'end', '')
  _client.hsetValue(mkey, 'status', code.mission_start)//1
  _client.hsetValue(mkey, 'sequence', 1)
  _client.hsetValue(mkey, 'room_name', _room.room_name)
  _client.hsetValue(mkey, 'pass_time', _room.pass_time)
  _client.hsetValue(mkey, 'team_id', _teamId)
  _client.hsetValue(mkey, 'members', JSON.stringify(_members))
  _client.hsetValue(mkey, 'macs', JSON.stringify(_macs))
  _client.hsetValue(mkey, 'count', _macs.length)
}

function initMacRedis(_client,_mac, _roomId,_mission_id, _sequence,_time) {
  _client.hsetValue(_mac, 'room_id', _roomId)
  _client.hsetValue(_mac, 'mission_id', _mission_id)
  _client.hsetValue(_mac, 'sequence', _sequence)
  if(_sequence === 1) {
    _client.hsetValue(_mac, 'start', _time)
  }
  _client.hsetValue(_mac, 'end', '')
  if(_time != null) {
    _client.hsetValue(_mac, 'start', _time)
  } else {
    _client.hsetValue(_mac, 'start', '')
  }
}

//Send mqtt with delay time
const sendMqttMessage = (_socket , _msgObj, _time) => {
  
  return new Promise((resolve, reject) => {
      if (_msgObj) {
          setTimeout(() => {
              let new_time = new Date().toISOString()
              _msgObj.recv = new_time
              sendMqttCmd(_socket, _msgObj)//To server.js mqtt client send message
              resolve()
          }, _time);
      } else {
          reject();
      }
  });
};

function getDbObj(_Obj) {
  let jsonObj = JSON.parse(JSON.stringify(_Obj))
  try {
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

async function saveRecord(_client, _roomId, _mac, _team_record_id,_end) {
  let _key = 'room'+ _roomId
  let team_id = await _client.hgetValue(_key, 'team_id')
  let mission_id = await _client.hgetValue(_mac, 'mission_id')
  let _start = await _client.hgetValue(_mac, 'start')
  if(_end === undefined ||_end === null) {
    _end = await _client.hgetValue(_mac, 'end')
  }
  if(_end === null) return null
  let _diff = getDiff(_start,_end)
  
  let saveObj = {
    "team_id": team_id,
    "room_id": _roomId,
    "mission_id": mission_id,
    "team_record_id": _team_record_id,
    "start": _start,
    "end": _end,
    "time": _diff
  }
  return dataResources.createRecord(saveObj)
}

async function saveTeamRecord(_client, _id, _status, _end) {
  let myKey = 'room'+_id
  let team_id = await _client.hgetValue(myKey, 'team_id')
  let team = await dataResources.getTeam(team_id)
  let _start = await _client.hgetValue(myKey, 'start')
  let _reduce = await _client.hgetValue(myKey, 'reduce')
  let _time = getDiff(_start, _end) + parseInt(_reduce) 
  
  let _sequence = await _client.hgetValue(myKey, 'sequence')
  
  let saveObj = {
    "team_id": team_id,
    "room_id": _id,
    "cp_id": team.cp_id,
    "total_time": _time,
    "reduce": _reduce,
    "status" : _status,
    "sequence": _sequence,
    "start": _start,
    "end": _end
  }
  return dataResources.createTeamRecord(saveObj)
}

function getDiff(start_time, end_tme) {
  let new1 = Date.parse(start_time)
  let new2 = Date.parse(end_tme)
  //最小整數
  let timestamp = Math.ceil((new2-new1)/1000)
  //Math.floor() 最大整數
  //let timestamp = Math.floor((new2-new1)/1000)
  return timestamp
}

function getCode(_key) {
  let mykey = 'Not_found'
  for(let key in code){
    if(code[key] === _key) {
      mykey = key
      break
    }
  }
  return mykey
}

async function switchMqttCmd(obj) {
  
  let macAddr = obj.macAddr
  let command = obj.key1
 
  if(command) {
    command = parseInt(command)
  }

  if(command === 0) {
    return
  }

  console.log(getLogTime()+'switchMqttCmd ---------------'+command )

  if(command === 5) {
    command = parseInt(obj.key2)
    //Send socket to web (status = 2)
    let time = new Date().toISOString()
    let cmdObj = getMqttObject( macAddr, command, time, 1)
    //switchMqttCmd for node response
    sendSocketCmd(socket, cmdObj)
    return
  }
  let mission = null
  let room_id = 0;
  //Get room_id
  if(command === code.security_event || command === code.reset_command) {//Security event 7

    let device = await dataResources.getSecurityNodeByMac(macAddr)
    room_id = device.setting_id
    console.log(getLogTime()+'get security room_id: '+ room_id )
  } else {
    
    mission = await dataResources.getMissionByMac(macAddr)
    room_id = mission.room_id
    console.log(getLogTime()+'get mission room_id: '+ room_id )
  }
  let roomKey = 'room'+room_id
  let path = roomPath+room_id+'.json'
  let roomObj = file.getJsonFromFile(path)
  const redisHandler  = require('../modules/redisHandler')
  const redisClient = new redisHandler(0)
  redisClient.connect()
  
  let currentMode = await redisClient.hgetValue(roomKey, 'mode')
  
  if(currentMode) currentMode = parseInt(currentMode)
  
  //Jason add for security mode
  if(currentMode === code.security_mode_command) {
    let currentSecurity = await redisClient.hgetValue(roomKey, 'security')
    
    if(currentSecurity) currentSecurity = parseInt(currentSecurity)
    
    if(command === code.reset_command ) {
      if(currentSecurity === code.security_event) {//Security reset
        try {
          toLog(2, 'security_reset')
          saveRoom(redisClient,roomObj,{
            roomId:room_id,
            mode: code.security_mode_command,
            security: 0,
          })
        } catch (error) {
          toLog('','@@ security_event error:'+error.message)
        }
        
        redisClient.quit()
        return
      }
    } else if(command === code.security_event) {//7
      //保全觸發
      try {
        toLog(2, 'security_event')
        const tool  = require('../modules/emaiTool')
        let time = new Date().toISOString()
        //Send socket to web (status = 7)
        let eventObj = getMqttObject( macAddr, code.security_event, time, 1)
        sendSocketCmd(socket, eventObj)
        //Save status to redis an file 
        saveRoom(redisClient,roomObj,{
          roomId:room_id,
          security:code.security_event
        })

        if(currentSecurity !== code.security_event) {
          let room = await dataResources.getRoom(room_id)
          let cpId = room.cp_id
            
          let admins = await dataResources.getAdmins()
          
          for(let n=0; n<admins.length; n++) {
            let email = admins[n]['email']
            tool.sendMail(email,'警告通知', room.room_name+'保全裝置被觸發')
          }
        }
      } catch (error) {
        toLog('','@@ security_event error:'+error.message)
      }
    } 

    redisClient.quit()
    return
  }
  //Close door
  if(command === code.door_off_notify) {
    toLog(2, 'door_off_notify')
    
    let door = await redisClient.hgetValue(roomKey, 'door')
    let status = await redisClient.hgetValue(roomKey, 'status')

    if(door) door = parseInt(door)
    if(status) status = parseInt(status)
    //關門後自動歸零
    /*if(status === code.emergency_stop || status === code.mission_pass || status === code.mission_fail){
      setRoomDefault(redisClient, room_id ,macAddr)
      toLog(3, 'Reset status to default')
    }*/ 
    let time = new Date().toISOString()
    let closeObj = getMqttObject( macAddr, code.door_off_notify, time, 1)
    sendSocketCmd(socket, closeObj)
    saveRoom(redisClient,roomObj,{
      roomId:room_id,
      door:code.door_off_notify
    })
    redisClient.quit()
  } else if(command === code.mission_end) {//2 mission end
    toLog(2, 'mission_end_command')
    let sequence = mission.sequence
    let count = await redisClient.hgetValue(roomKey, 'count')
    let status = code.mission_end//2
    count = parseInt(count)

    let end = new Date().toISOString()
    toLog(3,'mac :'+ macAddr + ', end:'+end)

    redisClient.hsetValue(macAddr, 'end', end)
    //Save status,end to redis and file
    
    
    let tmp = {roomId: room_id,status:status}
    if(sequence === count) {
      tmp.end = end
    }
    saveRoom(redisClient,roomObj,tmp)
    
    
    let cmdObj = getMqttObject( macAddr, code.mission_end, end, 1)
    sendSocketCmd(socket, cmdObj)
    
    if(count && count === sequence) {//最後一關 ,做停止流程
      let test = await toStopMssion(redisClient, room_id, code.mission_pass, end)
    } else {
      redisClient.quit()
    }
    
  } else if(command === code.emergency_stop) {
    //緊急按鈕 ,做停止流程
    const tool  = require('../modules/emaiTool')
    try {
      toLog(2, 'emergency_stop')
      let status = code.emergency_stop
      //Jason add for emergency stop without action on 2020.11.9
      let room = await dataResources.getRoom(room_id)
      let admins = await dataResources.getAdmins()
      //Email to administrator first
      for(let n=0; n<admins.length; n++) {
        let email = admins[n]['email']
        tool.sendMail(email,'警告通知', room.room_name+'緊急按鈕被啟動')
      }
      //Second check is action or not?
      let currentStatus = await redisClient.hgetValue(roomKey, 'status')
      if(currentStatus) {
        currentStatus = parseInt(currentStatus)
        //Not action only change status
        if(currentStatus !=1 && currentStatus!=2) {
          saveRoom(redisClient,roomObj,{roomId: room_id,status:status})
          redisClient.quit()
          return
        }
      }
      let end = new Date().toISOString()
      let test = await toStopMssion(redisClient, room_id, status, end)
      
    } catch (error) {
      toLog('','@@ emergency_stop error:'+error.message)
    }
  }
}

/**
 * function: open door,change door script, save team record
 * param 
 * _client: redis client
 * _mission: last sequence mission
 * _status: 3,4,6
 * _end: end time
 */
async function toStopMssion(_client, _roomId, _status, _end) {
  toLog('','@@ toStopMssion')
  console.log('roomId:'+_roomId+', status:'+_status+', time:'+_end)
  let roomKey = 'room'+_roomId
  let path = roomPath+_roomId+'.json'
  let roomObj = file.getJsonFromFile(path)
  let all = await _client.hgetall(roomKey)
  //let currentStatus = await _client.hgetValue(roomKey, 'status')
  let currentStatus = 0
  let count = 0
  let macs = []
  let currentSequence =0
  let doorMac = null

  if(all !== null) {//Check redis value
    toLog('','@@ from redis')
    currentStatus = parseInt(all.status)
    currentSequence = parseInt(all.sequence)
    count = parseInt(all.count)
    macs =  JSON.parse(all.macs)
    //Jason add for open door on 2020.10.14
    doorMac = all.doorMac
  } else {
    toLog('','@@ from file')
    currentStatus = roomObj['status']
    currentSequence = roomObj['sequence']
    count = roomObj['count']
    macs = roomObj['macs']
    //Jason add for open door on 2020.10.14
    doorMac = roomObj['doorMac']
  }
  console.log('toStopMssion status: '+_status +' , doorMac: '+doorMac)
  
  toLog('','@@ currentSequence :'+ currentSequence + ', currentStatus :'+currentStatus)
  if(currentSequence === 0 && currentStatus >= 10 ){
    //尚未闖關
    setRoomDefault(_client, _roomId , doorMac)
    _client.quit()
    return Promise.resolve(false)
  }

  if(currentStatus > 2 ){
    //已經執行過,避免重複
    _client.quit()
    return Promise.resolve(false)
  }
 
  //Open door (21)
  if(_status === code.mission_pass || _status === code.mission_fail) {
    toLog('', '@@ mqtt open door')
    let openTime = new Date().toISOString()
    let doorObj = getMqttObject( doorMac, code.node_on_command, openTime, 1)
    let mytest = await _client.remove(doorMac)
    sendMqttMessage(socket, doorObj, 0)
  }

  //setMissionEnd update status,end time ------------------------------
  let mac = macs[(currentSequence-1)]
  toLog(4,'save redis mac :'+ mac+', end:'+_end)
  let test = await _client.hsetValue(mac, 'end', _end)
  
  //Change status, end time,door open
  saveRoom(_client,roomObj,{
    roomId:_roomId,
    status:_status,
    door: code.door_on_notify,
    end:_end
  })
  //Save team record and mission record
  if(true) {
    toLog(5,'Before save team record')
    let result2 = await saveTeamRecord(_client, _roomId, _status, _end)
    toLog(5,'After save team record')
    let team_record_id = result2.id
    toLog(6,'Before save record')
    

    //Save 1
    for(let n=0;n<macs.length;n++) {
      if((n+1)<currentSequence) {
        let result = await saveRecord(_client, _roomId, macs[n], team_record_id,null)
        //console.log('saveRecord id:'+result.id)
      }
      //console.log(macs[n])
    }
    let result1 = await saveRecord(_client, _roomId, mac,team_record_id, _end)
    //console.log('saveRecord id:'+result1.id)
    toLog(6,'After save record')
  }
  

  //Send socket to web for change node status
  let cmdObj = getMqttObject( mac, _status, _end, 1)
  //Send MQTT to node
  sendSocketCmd(socket, cmdObj)
  //Jason modify for send MQTT stop command to game node on 2020.10.19
  if(_status === code.emergency_stop || _status === code.mission_fail) {
    let command = code.stop_command;//mission fail command:25 
    let cmdTime = new Date().toISOString()
    //If emergency command:26
    if(_status === code.emergency_stop) command = code.emergency_stop_command;//26
    
    for(let n=0;n<macs.length;n++) {
      let cmdObj = getMqttObject( macs[n], command, cmdTime, 1)
      sendMqttMessage(socket, cmdObj, 0)
    }
  }
  
  
  _client.quit()
  return Promise.resolve(true)
}

async function toGetDefaultMission(roomId) {
  
  let _missions = await dataResources.getMissions(roomId, 0)
  toLog('t1','toGetDefaultMission: '+ _missions.length)
  if(_missions.length == 0) {
    return null
    //return notFound(res,'getDefaultMission','Not found default mission')
  }

  let _mission = _missions[0]
  toLog('t2','mission id '+ _mission.id)
  
  let _scripts = await dataResources.getDefaultScript(roomId, _mission.id)
  if(_scripts.length == 0) {
    return null
    // return notFound(res,'getDefaultMission','Not found default scripts')
  }
  toLog('t3','get default scripts '+ _scripts.length)
  let _inx = getRandom(_scripts.length)
  toLog('t4','get default index '+ _inx)
  let _script = _scripts[_inx]
  let m = JSON.parse(JSON.stringify(_mission))
  /*if(typeof _script.pass === 'string') {
    _script.pass = JSON.parse(_script.pass)
  }
  _script.pass = _script.pass.value*/
  m.script = _script
  return m
}
