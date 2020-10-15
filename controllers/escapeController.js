'use strict'

/*!
 * Module dependencies
 */

//const authResources = require('../lib/authResources')
const resResources = require('../lib/resResources')
const dataResources = require('../lib/dataResources')
const appConfig = require('../config/app.json')
let wsUrl ='http://localhost:'+appConfig.port
const io = require('socket.io-client')
const socket = io.connect(wsUrl, {reconnect: true})
const redisHandler  = require('../modules/redisHandler')
const file = require('../modules/fileTools')
const code = require('../doc/setting/code.json')
let roomPath = './doc/room/room';

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

socket.on('update_mqtt_ul',function(data){
  console.log('escapeController update_mqtt_ul :'+ data.key1);
  switchMqttCmd(data)
});

socket.on('change_mode',function(data){
  console.log('escapeController change_mode :'+ data.mode);
  switchMode(data.room_id, data.mode)
});

module.exports = {
    async getDefaultMission(req, res, next) {
      try {
        
        toLog(1,'getDefaultMission -------------------')
        //let input = checkInput(req, ['room_id', 'user_id'])
        let input = checkInput(req, ['room_id'])
        
        if(input === null) {
          return missParam(res, 'getDefaultMission', 'miss param')
        }
        //let user_id = parseInt(input.user_id)
        let room_id = input.room_id
        let roomkey = 'room'+room_id
        let redisClient = new redisHandler(0)
          redisClient.connect()
        let mission = await redisClient.hgetValue(roomkey, 'door_mission')
        if(mission !== null) {
          mission = JSON.parse(mission)
        } else {
          mission = await toGetDefaultMission(room_id)
          redisClient.hsetValue(roomkey, 'door_mission', JSON.stringify(mission))
        }
        
        redisClient.quit()
        
        toLog(5,'response 200')
        
        resResources.getDtaSuccess(res, mission)
      } catch (error) {
        toLog(5,'@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    async sendMqttCmd(req, res, next) {
      try {
        let receiveTime = new Date().toISOString()
        toLog(1,'sendMqttCmd -------------------')
        let input = checkInput(req, ['room_id','macAddr','command'])
        
        if(input === null) {
          return missParam(res, 'sendMqttCmd', 'miss param')
        }
        let room_id = parseInt(input.room_id)
        let macAddr = input.macAddr
        let command = parseInt(input.command)
        

        if(macAddr === 'default') {
          let roomKey = 'room'+room_id
          let path = roomPath+room_id+'.json'
          let roomObj = file.getJsonFromFile(path)
          let redisClient = new redisHandler(0)
          redisClient.connect()
          let user_id = req.body.user_id || req.query.user_id
          if(user_id === undefined || user_id === null) {
            return missParam(res, 'sendMqttCmd', 'miss param user_id')
          }
          toLog(2,'befor get teamMember')
          let teamUser = await dataResources.getTeamUser(user_id)
          toLog(2,'after get teamMember : '+ teamUser.team_id)
          //Get missions from db
          toLog(3,'befor get default mission')
          let _missions = await dataResources.getMissions(room_id, 0)
          toLog(3,'after get default mission : '+ _missions.length)
          if(_missions.length == 0) {
            return notFound(res, 'sendMqttCmd','Not found default mission' )
          }
          let m = _missions[0]
          macAddr = m.macAddr
          if(macAddr === undefined || macAddr === null) {
            return notFound(res, 'sendMqttCmd','Not found default device' )
          }
          //Record door status
          let status = code.door_off_notify//10//11
          if(command === code.node_on_command) {//21
            status = code.door_on_notify//11
          } else if(command === code.node_off_command){//20
            status = code.door_off_notify//10
          }
          //redisClient.hsetValue(roomKey,'door', status)
          redisClient.hsetValue(macAddr,'door', status)
          redisClient.hsetValue(macAddr,'room_id',room_id)
          //Save room to redis and file
          saveRoom(redisClient,null,{
            roomId:room_id,
            sequence:0,
            doorMac:macAddr,
            status:status,
            team_id:teamUser.team_id,
            reduce:0,
            prompt:0
          })
          /*redisClient.hsetValue(roomKey,'status',status)
          redisClient.hsetValue(roomKey,'team_id',teamUser.team_id)
          redisClient.hsetValue(roomKey,'doorMac',macAddr)
          redisClient.hsetValue(roomKey,'sequence',0)
          redisClient.hsetValue(roomKey,'prompt',0)
          redisClient.hsetValue(roomKey,'reduce',0)*/
          /*if(roomObj === undefined || roomObj === null)
            roomObj = {}
          roomObj['sequence'] = 0
          roomObj['prompt'] = 0
          roomObj['reduce'] = 0
          roomObj['team_id'] = teamUser.team_id
          roomObj['status'] = status
          roomObj['doorMac'] = macAddr
          file.saveJsonToFile(path, roomObj)*/
          redisClient.quit()
        } else {
          //判斷是否有此裝置
        }
		    toLog(3,'get macAddr : '+ macAddr)
        let cmdObj = getMqttObject( macAddr, command, receiveTime, 1)
        //Save mac status to report
        //dataResources.saveReport(cmdObj)
        //Send MQTT command to node
        sendMqttMessage(socket, cmdObj)//To server.js mqtt client send message
        
        
		    toLog(4,'response 200')
        resResources.doSuccess(res, 'Send mqtt command ok')
      } catch (error) {
        toLog(4,'@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    async setMissionAction(req, res, next) {
      
      let actionTime = new Date().toISOString()
      toLog(1,'setMissionAction -------------------')
      let input = checkInput(req, ['room_id', 'user_id'])
      
      if(input === null) {
        missParam(res, 'setMissionAction', 'miss param')
      }
      //let user_id = parseInt(input.user_id)
      let room_id = input.room_id
      let user_id = parseInt(input.user_id)
      let roomKey = 'room'+room_id
      let path = roomPath+room_id+'.json'
      let roomObj = file.getJsonFromFile(path)
      //Connect redis
      let redisClient = new redisHandler(0)
      redisClient.connect()
        

      try {
        //Jason test bypass
        //let currentSequence = await redisClient.hgetValue(roomKey, 'sequence')
        let status = await redisClient.hgetValue(roomKey, 'status')
        let doorMac = await redisClient.hgetValue(roomKey, 'doorMac')
		    
        if(status === null) {
          if(roomObj)
            //currentSequence = roomObj['sequence']
            status = roomObj['status']
        } else {
          //currentSequence = parseInt(currentSequence)
          status = parseInt(status)
        }
        
        if(status !== code.door_off_notify) {//10
          if(status === code.mission_start || status === code.mission_end) {
            //已開始闖關,重複發出命令----------------------------------
            toLog('','@@ Already acted')
            notAllowed(res, 'setMissionAction', 'Already acted')
          } else if(status === code.emergency_stop) {
            //進入大門尚未闖關按下緊急按紐------------------------------
            setRoomDefault(redisClient, room_id ,doorMac)
            toLog('','@@ Emergency door open')
            conflict(res, 'setMissionAction', 'Emergency door open')
          } else if(status === code.door_on_notify){
            //未關大門 ------------------------------------------------
            toLog('','@@ Door open')
            notAcceptable(res, 'setMissionAction', 'Door open')
          } else if(status === 0){
            //未解大門謎題,直接進入者 ??????????????????????????????????
            toLog('','@@ Door mission fail')
            notAcceptable(res, 'setMissionAction', 'Door mission fail')
          }
          redisClient.quit()
          return
        }

        toLog(2,'Before get members')
        const obj = await dataResources.getMembers(user_id)
        toLog(2,'After get team :'+ obj.team_id)
		    console.log(obj.members)
        if(obj === null) {
          toLog('','@@ Not join team')
          return notAllowed(res, 'setMissionAction','Not join team')
        }
        let teamId = obj.team_id
        let members = obj.members

        //Get room
        toLog(3,'Before get room')
        let room = await dataResources.getRoom(room_id)
        toLog(3,'After get room')
		    console.log(room)
        if(room === null ) {
          return notFound(res, 'setMissionAction', 'Not found room')
        }
        //Get missions
        toLog(4,'Before get mission')
        let mList = await dataResources.getMissions(room_id, null)
		    toLog(4,'After get mission :'+mList.length)
        
        if(mList === null || mList.length === 0 ) {
          return notFound(res, 'setMissionAction', 'Not found mission '+ mList.length)
        }

        toLog(6, 'Before get getGroupScript')
        let scriptGroup = await dataResources.getGroupScript(room_id)
        toLog(6, 'After get getGroupScript '+Object.keys(scriptGroup).length)
        if(Object.keys(scriptGroup).length === 0 ) {
          return notFound(res, 'setMissionAction','Not found script')
        }
        
        let defaultIndex = -1
        for(let i=0;i<mList.length;i++) {
          if(mList[i].sequence ===0){
            defaultIndex = i
            break
          }
        }

        let macList = []
        let inx = 0
        let lists = JSON.parse(JSON.stringify(mList))
        if(defaultIndex > -1) 
          lists.splice(defaultIndex, 1);
        toLog(8,'save mission redis and random script')
        for(let i=0;i<lists.length;i++) {

          let mission = lists[i]
          //Filter emergency mac of room 
          if(mission.sequence === null || mission.sequence === 0) {//Mission 0 for emergency
            continue
          } 
          macList.splice(inx, 0 , mission.macAddr)
          inx++
          if(mission.sequence ===1) {
            let cmdObj = getMqttObject( mission.macAddr, code.mission_start, actionTime, 1)//code.mission_start:1
            toLog(9,'Before save report')
            let test = await dataResources.saveReport(cmdObj)
            toLog(9,'After save report')
            roomObj['start'] = actionTime
            //Send socket to web
            sendSocketCmd(socket, cmdObj)
            //code.mission_start_command 23: 啟動 node
            let startNodeObj = getMqttObject( mission.macAddr, code.mission_start_command, actionTime, 1)
            //Save mac status to report
            //dataResources.saveReport(startNodeObj)
            /*** MQTT command 23 ***/
            sendMqttMessage(socket, startNodeObj, 0)
            
            initMacRedis(redisClient,mission.macAddr, room_id, mission.id,mission.sequence, actionTime )
          }
            
          else {
            initMacRedis(redisClient,mission.macAddr, room_id, mission.id, mission.sequence, null )
         
          }
          mission.script = getScript(scriptGroup[mission.id])
          if(typeof mission.script.pass === 'string') {
            mission.script.pass = JSON.parse(mission.script.pass)
          }
          let time = new Date().toISOString()
          let passObj = getMqttObject( mission.macAddr, mission.script.pass, time, 1)
          /*** MQTT pass ***/
          sendMqttMessage(socket, passObj, ((i+1)*500))
        }
        roomObj.room = room
        roomObj.members = members
        roomObj.status = code.mission_start//1
        roomObj.sequence = 1
        roomObj.start = actionTime
        roomObj.doorMac = doorMac
        roomObj.missions = lists
        roomObj.macs = macList
        roomObj.count = macList.length
        
        initRoomRedis(redisClient, room, teamId, members, actionTime,macList)
 
        
        
        file.saveJsonToFile(path, roomObj)
        let data = {"room":roomObj.room, "members":roomObj.members, "missions":roomObj.missions }
        toLog(10,'response 200')
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
      //Connect redis
      let redisClient = new redisHandler(0)
      redisClient.connect()
        
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
        
        let redisClient = new redisHandler(0)
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
          return notAllowed(res, 'setMissionStart', 'Mission not action yet')
        }
        if(currentSequence !== (sequence-1) || sequence > count) {
          toLog('','@@ Not allowed sequence:'+sequence)
          return notAllowed(res, 'setMissionStart', 'Not allowed sequence')
        }
        let mac = macs[(currentSequence-1)]
        toLog(3,'mac1 :'+ mac)
        let end = await redisClient.hgetValue(mac, 'end')
        toLog(4,'mac1 end :'+ end)
        if(end === null) {
          toLog('','@@ Not complete previous mission')
          return notAllowed(res, 'setMissionStart', 'Not complete previous mission')
        }
        let mac2 = macs[(currentSequence)]
        toLog(5,'mac2 :'+ mac2)
        let start = await redisClient.hgetValue(mac2, 'start')
        toLog(6,'mac2 start:'+ start)
        if(start !== null && start !== '') {
          toLog('','@@ Repeat command')
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
        
        let startNodeObj = getMqttObject( mac2, code.mission_start_command, startTime, 1)
        //Save mac2 command to report
        //dataResources.saveReport(startNodeObj)
        //MQTT Command 23: 啟動 node
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
        
        let redisClient = new redisHandler(0)
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
          return notAllowed(res, 'setMissionEnd', 'Mission not action yet')
        }
        if(currentSequence !== sequence || sequence > count) {
          toLog('','@@ Not allowed sequence :'+ sequence)
          return notAllowed(res, 'setMissionEnd', 'Not allowed sequence')
        }
        let mac = macs[(sequence-1)]
        toLog(3,'mac :'+ mac)
        let start = await redisClient.hgetValue(mac, 'start')
        toLog(4,'start :'+ start)
        if(start === null || start === '') {
          toLog('','@@ Not start mission')
          return notAllowed(res, 'setMissionEnd', 'Not start mission')
        }
        let end = await redisClient.hgetValue(mac, 'end')
        toLog(5,'end :'+ end)
        if(end !== null && end !== '') {
          toLog('','@@ Repeat command')
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
        roomObj['status'] = code.mission_end//2
        file.saveJsonToFile(path, roomObj)
        redisClient.hsetValue(roomKey, 'status', code.mission_end)
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
        //Command 24: 停止 node
        
        let endNodeObj = getMqttObject( mac, code.mission_end_command, endTime, 1)
        //Save mac command to report
        //dataResources.saveReport(endNodeObj)
        //Send mqtt command 24 to Node
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
      let newTime = new Date().toISOString()
      toLog(1,'getMissionStatus -------------------')
      try {
        let input = checkInput(req, ['room_id'])
      
        if(input === null) {
          toLog('','@@ miss param')
          return missParam(res, 'getMissionData', 'miss param')
        }
        //let user_id = parseInt(input.user_id)
        let room_id = parseInt(input.room_id)
        let roomKey = 'room'+room_id
        let path = roomPath+room_id+'.json'
        let roomObj = file.getJsonFromFile(path)
        let pass_time = 0
        let count = 0
        let start = null
        //Connect redis
        
        let redisClient = new redisHandler(0)
        redisClient.connect()
        
        let data = {
          mode:30,
          team_id:0,
          countdown:0,
          sequence:0,
          status: await redisClient.hgetValue(roomKey, 'status'), 
          reduce:0, 
          prompt:0
        }
        
        if(data.status !== null) {//Check redis value
          toLog(2,'get room data from redis')
          data.sequence = await redisClient.hgetValue(roomKey, 'sequence')
          data.team_id = await redisClient.hgetValue(roomKey, 'team_id')
          data.reduce = await redisClient.hgetValue(roomKey, 'reduce')
          data.prompt = await redisClient.hgetValue(roomKey, 'prompt')
          data.mode = await redisClient.hgetValue(roomKey, 'mode')
          data.sequence = parseInt(data.sequence)
          data.status = parseInt(data.status)
          data.prompt = parseInt(data.prompt)
          data.reduce = parseInt(data.reduce)

          if(data.team_id) {
            data.team_id = parseInt(data.team_id)
          }
          
          if(data.sequence > 0) {
            pass_time = await redisClient.hgetValue(roomKey, 'pass_time')
            count = await redisClient.hgetValue(roomKey, 'count')
            start = await redisClient.hgetValue(roomKey, 'start')
            count = parseInt(data.count)
            pass_time = parseInt(pass_time)
          }
          if(data.mode === undefined || data.mode === null) {
            data.mode = 30
          } else {
            data.mode = parseInt(data.mode)
          }
        } else if(roomObj.hasOwnProperty('sequence')){
          toLog(2,'get room data from file')
          data.sequence = roomObj['sequence']
          data.status = roomObj['status']
          data.team_id  = roomObj['team_id']
          data.reduce = roomObj['reduce']
          data.prompt = roomObj['prompt']
          data.mode = roomObj['mode']

          if(data.sequence > 0) {
            count = roomObj['count']
            start = roomObj['start']
          }
          if(roomObj['room']) {
            pass_time  = roomObj['room']['pass_time']
          }
            
          if(data.mode === undefined || data.mode === null) {
            data.mode = 30
          }
        }

        console.log('sequence:'+data.sequence+ ', status:'+data.status)

        if(data.status === undefined || data.status === null){
            data.status = 0
            setRoomDefault(redisClient, room_id ,null)
        } else if(data.status === 1 || data.status === 2) {//During in pass mission
            let now = new Date().toISOString()
            let diff = getDiff(start, now)
            //toLog('','@@ get diff :'+diff)
            //Jason add for reduce on 2020.10.08
            data.countdown = pass_time - diff - data.reduce

            if(data.countdown < 0) {
              data.countdown = 0
            } else if (data.sequence === data.count && data.status === 2 && data.countdown > 0) {
              // To verify last sequence then do pass flow after mqtt end 
              data.status = code.mission_pass //3
              data.countdown = 0
              roomObj['status'] = data.status
              file.saveJsonToFile(path, roomObj)
              redisClient.hsetValue(roomKey, 'status', data.status)
            }
            toLog('', '@@ get countdown :'+data.countdown)
        }
        
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
        //let input = checkInput(req, ['room_id', 'user_id'])
        let input = checkInput(req, ['room_id','prompt','time'])
        
        if(input === null) {
          return missParam(res, 'setReduce', 'miss param')
        }
        //let user_id = parseInt(input.user_id)
        let room_id = input.room_id
        let roomKey = 'room'+room_id
        let prompt = input.prompt
        let time = input.time
        let path = roomPath+room_id+'.json'
        let roomObj = file.getJsonFromFile(path)
        //Connect redis
        let redisClient = new redisHandler(0)
        redisClient.connect()
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
        console.log('reduce:'+reduce+', prompt:'+prompt)
        redisClient.hsetValue(roomKey, 'reduce', reduce)
        redisClient.hsetValue(roomKey, 'prompt', prompt)
        toLog(3,'Save to file')
        //Save to file
        roomObj.reduce = reduce
        roomObj.prompt = prompt
        file.saveJsonToFile(path, roomObj)
        //Send sock to web
        toLog(4,'Send sock to web')
        let now = new Date().toISOString
        let cmdObj = getMqttObject( 'reduce', time, now, 1)
        //Send socket to web
        sendSocketCmd(socket, cmdObj)
        toLog(5,'@@ response 200 ')
        resResources.doSuccess(res, 'Set reduce ok')
      } catch (error) {
        toLog(5,'@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }
    },

    async setMode(req, res, next) {
      try {
        toLog(1,'setMode -------------------')
        //let input = checkInput(req, ['room_id', 'user_id'])
        let input = checkInput(req, ['room_id'])
        let mode = req.params.mode
        if(input === null || mode === null) {
          return missParam(res, 'setMode', 'miss param')
        }
        let room_id = input.room_id
        switchMode(room_id, mode)
        toLog('','@@ response 200 ')
        resResources.doSuccess(res, 'Set mode mode '+mode+' ok')
      } catch (error) {
        toLog('','@@ response 500 :'+error.message)
        resResources.catchError(res, error.message)
      }

    }
}

async function switchMode(_room_id, _mode) {
  //Connect redis
  let redisClient = new redisHandler(0)
  redisClient.connect()
  
  console.log('room_id'+_room_id+', mode:'+_mode)
  toLog(2,'get data from file')
  
  let roomKey = 'room'+_room_id
  let path = roomPath+_room_id+'.json'
  let roomObj = file.getJsonFromFile(path)
  //Set to redis
  toLog(2,'Save mode to redis')
  let oldMode = await redisClient.hgetValue(roomKey,'mode')
  if(oldMode === null) {
    oldMode = code.game_mode_command
  } else {
    oldMode = parseInt(oldMode)
  }
  redisClient.hsetValue(roomKey,'mode',_mode)
  
  //Set to file
  toLog(3,'Save mode to file')
  if(typeof _mode === 'string')
    _mode = parseInt(_mode)
  roomObj['mode'] = _mode
  file.saveJsonToFile(path, roomObj)
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
      sendMqttMessage(socket, mObj, m*500)
    }
    /*if(oldMode === code.security_mode_command) {
      //Send MQTT node_off_command to seurity node
      toLog(6,'Before get security device')
      //let sList = await dataResources.getSeurityNode(_room_id)
      let sList = await dataResources.getMissions(_room_id, null)
      toLog(6,'After get security device :'+sList.length)

      for(let n=0;n<sList.length;n++) {
      
        let device = sList[n]
        let nObj = getMqttObject( device.macAddr, code.node_off_command, actionTime, 1)
        // MQTT secrity node off command 
        sendMqttMessage(socket, nObj, n*500)
      }
    }*/
    
  } else if(_mode===code.security_mode_command){
    //Jason note : ?????????????????????????????????????????????
    //Send MQTT node_off_command to seurity node
    let actionTime = new Date().toISOString
    /*toLog(5,'Before get security device')
    //let sList = await dataResources.getSeurityNode(_room_id)
    let sList = await dataResources.getMissions(_room_id, null)
    toLog(5,'After get security device :'+sList.length)

    for(let n=0;n<sList.length;n++) {
    
      let device = sList[n]
      let nObj = getMqttObject( device.macAddr, code.node_on_command, actionTime, 1)
      // MQTT secrity node off command 
      sendMqttMessage(socket, nObj, n*500)
    }*/
  
  }
  redisClient.quit()
  
}

function setRoomDefault(client,roomId,mac) {
  
  let tmp = {roomId:roomId,sequence:0,doorMac:mac,status:0,team_id:0,reduce:0,prompt:0,start:'',end:''}
  saveRoom(client,null, tmp)
}

function saveRoom(_client,rObj, myJson) {
  let key = 'room' + myJson.roomId
  let path = roomPath+myJson.roomId+'.json'

  if(rObj === undefined || rObj === null) {
    rObj = {}
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
    _client.hsetValue(key, 'macs', myJson.macs)
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

  if(myJson.hasOwnProperty('door_mission')){
    _client.hsetValue(key, 'door_mission', myJson.end)
    rObj.door_mission = myJson.door_mission
  }
   
  file.saveJsonToFile(path, rObj)
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
    let redisClient = new redisHandler(0)
    redisClient.connect()

    let test = toStopMssion(redisClient, room_id, _status, end)

    if(test === null) {//Check sequence
      toLog('s3','@@ Mission not action yet')
      return notAllowed(_res, 'setMissionStop', 'Mission not action yet')
    }
    
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
      console.log(result)
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

function getMqttObject( _mac, _command, _time, _count) {
  if(typeof _command === 'object')
    //return {"macAddr":_mac,"pass":_command.value,"recv":_time,"fport":99,"frameCnt":_count}
    return {"macAddr":_mac,"pass":_command.value,"recv":_time,"fport":99}
  else  
    //return {"macAddr":_mac,"data":{"key1":_command},"recv":_time,"fport":99,"frameCnt":_count}
    return {"macAddr":_mac,"data":{"key1":_command},"recv":_time,"fport":99}
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
  dataResources.showLog('## '+_num+'. '+_msg)
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
  toLog(1,'switchMqttCmd -------------------'+command )
  let mission = await dataResources.getMissionByMac(macAddr)
  let room_id = mission.room_id
  if(mission === null) 
    return
  let redisClient = new redisHandler(0)
  redisClient.connect()
  
  if(command === code.door_off_notify) {
    toLog(2, 'door_off_notify')
    let roomKey = 'room'+room_id
    let path = roomPath+room_id+'.json'
    let roomObj = file.getJsonFromFile(path)
    let doorStatus = await redisClient.hgetValue(macAddr, 'door')
    if(doorStatus) doorStatus = parseInt(doorStatus)
    if(doorStatus === code.door_on_notify) {
      //表示大門開啟過,然後上報關閉,表示進入可啟動模式 ,若要開啟輔助照明可於此開啟
      //存到Redis
      redisClient.hsetValue(macAddr, 'door', code.door_off_notify)
      /*redisClient.hsetValue(roomKey, 'status', code.door_off_notify)
      roomObj['status'] = code.door_off_notify
      file.saveJsonToFile(path, roomObj)*/
      //setRoom(redisClient, roomObj, JSON)
      saveRoom(redisClient,roomObj,{
        roomId:room_id,
        status:code.door_off_notify
      })
      //收到 MQTT時就存到DB
      toLog(3, 'save door status door_off_notify :' + code.door_off_notify)
    } else {
      setRoomDefault(redisClient, room_id ,macAddr)
    }
    redisClient.quit()
  } else if(command === code.mission_end) {//2 mission end
    toLog(2, 'mission_end_command')
    let roomKey = 'room'+room_id
    let sequence = mission.sequence
    let count = await redisClient.hgetValue(roomKey, 'count')
    let status = code.mission_end//2
    count = parseInt(count)
    
    let path = roomPath+room_id+'.json'
    let roomObj = file.getJsonFromFile(path)
    let end = new Date().toISOString()
    toLog(3,'mac :'+ macAddr + ', end:'+end)

    let setresult = await redisClient.hsetValue(macAddr, 'end', end)
    let setresult2 = await redisClient.hsetValue(roomKey, 'status', status)
    roomObj['end'] = end
    roomObj['status'] = status
    file.saveJsonToFile(path, roomObj)
    
    //Save node status 2 to DB
    let cmdObj = getMqttObject( macAddr, code.mission_end, end, 1)
    toLog(4,'Before save report')
    let result = await dataResources.saveReport(cmdObj)
    toLog(4,'After save report')
    //Send socket to web (status = 2)
    sendSocketCmd(socket, cmdObj)
    
    if(count === sequence) {//最後一關 ,做停止流程
      toStopMssion(redisClient, room_id, code.mission_pass, end)
    } else {
      redisClient.quit()
    }
    
  } else if(command === code.emergency_stop) {
    //緊急按鈕 ,做停止流程
    try {
      toLog(2, 'emergency_stop')
      let status = code.emergency_stop
      let end = new Date().toISOString()
      toStopMssion(redisClient, room_id, status, end)
      
    } catch (error) {
      toLog('','@@ emergency_stop error:'+error.message)
    }
  }
}

/**
 * param 
 * _client: redis client
 * _mission: last sequence mission
 * _status: 3,4,6
 * _end: end time
 */
async function toStopMssion(_client, _roomId, _status, _end) {
  
  let roomKey = 'room'+_roomId
  let path = roomPath+_roomId+'.json'
  let roomObj = file.getJsonFromFile(path)
  let currentStatus = await _client.hgetValue(roomKey, 'status')
  let count = 0
  let macs = []
  let currentSequence =0
  let doorMac = null

  if(currentStatus !== null) {//Check redis value
    currentSequence = await _client.hgetValue(roomKey, 'sequence')
    count = await _client.hgetValue(roomKey, 'count')
    macs =  await _client.hgetValue(roomKey, 'macs')
    //Jason add for open door on 2020.10.14
    doorMac = await _client.hgetValue(roomKey, 'doorMac')
    currentSequence = parseInt(currentSequence)
    currentStatus = parseInt(currentStatus)
    if(count)
      count = parseInt(count)
    if(macs)
      macs = JSON.parse(macs)
  } else {
    toLog('','@@ from redis null')
    currentSequence = roomObj['sequence']
    count = roomObj['count']
    macs = roomObj['macs']
    currentStatus = roomObj['status']
    //Jason add for open door on 2020.10.14
    doorMac = roomObj['doorMac']
  }
  console.log('toStopMssion status: '+_status +' , doorMac: '+doorMac)
  
  toLog('','@@ currentSequence :'+ currentSequence + ', currentStatus :'+currentStatus)
  if(currentSequence === 0 || currentStatus > 10 ){
    //尚未闖關
    setRoomDefault(_client, _roomId , doorMac)
    return false
  }
 
  //Set door open 21
  if(_status === code.mission_pass || _status === code.mission_fail) {
    toLog('', '@@ mqtt open door')
    let openTime = new Date().toISOString()
    let doorObj = getMqttObject( doorMac, code.node_on_command, openTime, 1)
    sendMqttMessage(socket, doorObj, 0)
  }

  //setMissionEnd update status,end time ------------------------------
  let mac = macs[(currentSequence-1)]
  let test = await _client.hsetValue(mac, 'end', _end)
  //Update room status, end to redis and file
  saveRoom(_client, roomObj,{
    roomId:_roomId,
    status:_status,
    end:_end
  })

  toLog(4,'save redis mac :'+ mac)

  //Change door mission
  let door_mission = await toGetDefaultMission(_roomId)
  _client.hsetValue(roomKey, 'door_mission', JSON.stringify(door_mission))
  
  //Save team record and mission record
  if(true) {
    toLog(5,'Before save team record')
    let result2 = await saveTeamRecord(_client, _roomId, _status, _end)
    toLog(5,'After save team record')
    let team_record_id = result2.id
    toLog(6,'Before save record')
    
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
  //Send MQTT energemcy stop command to node
  if(_status === code.emergency_stop) {
    for(let k=0;k<macs.length;k++) {
      let endNodeObj = getMqttObject( macs[k], code.emergency_stop_command, _end, 1)
      sendMqttMessage(socket, endNodeObj, (k+1)*500)
    }
  } 
  
  
  _client.quit()
  return true
}

async function toGetDefaultMission(roomId) {
  
  let _missions = await dataResources.getMissions(roomId, 0)
  toLog('t1','toGetDefaultMission: '+ _missions.length)
  if(_missions.length == 0) {
    return null
    //return notFound(res,'getDefaultMission','Not found default mission')
  }
  let redisClient = new redisHandler(0)
  redisClient.connect()

  let _mission = _missions[0]
  toLog('t2','mission id '+ _mission.id)
  
  let _scripts = await dataResources.getDefaultScript(roomId, _mission.id)
  if(_scripts.length == 0) {
    return null
    // return notFound(res,'getDefaultMission','Not found default scripts')
  }
  toLog('t3','get default scripts '+ _scripts.length)
  let _inx = getRandom(_scripts.length)
  let _script = _scripts[_inx]
  let m = JSON.parse(JSON.stringify(_mission))
  if(typeof _script.pass === 'string') {
    _script.pass = JSON.parse(_script.pass)
  }
  _script.pass = _script.pass.value
  m.script = _script
  return m
}
