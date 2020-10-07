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

module.exports = {
    async getDefaultMission(req, res, next) {
      try {
        let defaultTime = new Date().toISOString()
        toLog(1,'getDefaultMission -------------------')
        //let input = checkInput(req, ['room_id', 'user_id'])
        let input = checkInput(req, ['room_id'])
        
        if(input === null) {
          return missParam(res, 'getDefaultMission', 'miss param')
        }
        //let user_id = parseInt(input.user_id)
        let room_id = input.room_id
        let roomKey = 'room'+room_id
        let _missions = await dataResources.getMissions(room_id, 0)
        toLog(2,'get default mission '+ _missions.length)
        if(_missions.length == 0) {
          return notFound(res,'getDefaultMission','Not found default mission')
        }
        let redisClient = new redisHandler(0)
        redisClient.connect()

        let _mission = _missions[0]
        toLog(3,'mission id '+ _mission.id)
        
        let _scripts = await dataResources.getDefaultScript(room_id, _mission.id)
        if(_scripts.length == 0) {
          return notFound(res,'getDefaultMission','Not found default scripts')
        }
        toLog(4,'get default scripts '+ _scripts.length)
        let _inx = getRandom(_scripts.length)
        let _script = _scripts[_inx]
        let m = JSON.parse(JSON.stringify(_mission))
        if(typeof _script.pass === 'string') {
          _script.pass = JSON.parse(_script.pass)
        }
        _script.pass = _script.pass.value
        m.script = _script

        toLog(5,'response 200')
        
        resResources.getDtaSuccess(res, m)
      } catch (e) {
        toLog(5,'@@ response 500 :'+e.message)
        resResources.catchError(res, e.message)
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
        let roomKey = 'room'+room_id
        let redisClient = new redisHandler(0)
        redisClient.connect()
        
        
        if(macAddr === 'default') {
          let user_id = req.body.user_id || req.query.user_id
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
          redisClient.hsetValue(roomKey,'status',status)
          redisClient.hsetValue(roomKey,'team_id',teamUser.team_id)
          redisClient.hsetValue(roomKey,'doorMac',macAddr)
          redisClient.hsetValue(roomKey,'sequence',0)
          redisClient.hsetValue(roomKey,'prompt',0)
          redisClient.hsetValue(roomKey,'reduce',0)
        } else {
          //判斷是否有此裝置
        }
		    toLog(3,'get macAddr : '+ macAddr)
        let cmdObj = getMqttObject( macAddr, command, receiveTime, 1)
        //Save mac status to report
        //dataResources.saveReport(cmdObj)
        //Send MQTT command to node
        sendMqttMessage(socket, cmdObj)//To server.js mqtt client send message
        
        redisClient.quit()
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
            //進入大門尚未闖安按下緊急按紐------------------------------
            setDefaultStatus(redisClient, roomKey)
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
        roomObj['status'] = code.mission_start //1
        roomObj['sequence'] = sequence
        file.saveJsonToFile(path, roomObj)
        redisClient.hsetValue(roomKey, 'status', code.mission_start)
        redisClient.hsetValue(roomKey, 'sequence', sequence)
        redisClient.quit()
        
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
        if(true) {
          toLog(6,'Before save record')
          let result = await saveRecord(redisClient, room_id, mac, endTime)
          toLog(6,'After save record')
        }
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
        let countdown = 0
        //Connect redis
        
        let redisClient = new redisHandler(0)
        redisClient.connect()
        let status = await redisClient.hgetValue(roomKey, 'status')
        let currentSequence = await redisClient.hgetValue(roomKey, 'sequence')
        let count = await redisClient.hgetValue(roomKey, 'count')
        let macs =  await redisClient.hgetValue(roomKey, 'macs')
        let start = await redisClient.hgetValue(roomKey, 'start')
        let team_id = await redisClient.hgetValue(roomKey, 'team_id')
        let pass_time = await redisClient.hgetValue(roomKey, 'pass_time')
        let reduce = await redisClient.hgetValue(roomKey, 'reduce')
        let prompt = await redisClient.hgetValue(roomKey, 'prompt')
        
        toLog(2,'get sequence, count , macs from redis')
        console.log('currentSequence:'+currentSequence+ ', count:'+count+', macs'+macs)
        
        if(status === null) {//Check redis value
          toLog('','@@ from redis null')
          currentSequence = roomObj['sequence']
          count = roomObj['count']
          macs = roomObj['macs']
          status = roomObj['status']
          team_id  = roomObj['team_id']
          start  = roomObj['start']
          reduce = roomObj['reduce']
          prompt = roomObj['prompt']
          if(roomObj['room'])
            pass_time  = roomObj['room']['pass_time']
        }

        if(typeof status === 'string') {
          currentSequence = parseInt(currentSequence)
          count = parseInt(count)
          macs = JSON.parse(macs)
          status = parseInt(status) 
          pass_time = parseInt(pass_time)
          team_id = parseInt(team_id)
        }

        if(status === undefined || status === null){
            setDefaultStatus(redisClient, roomKey)
            team_id = 0
            countdown = 0
            currentSequence =0
            status = 0
            reduce = 0
            prompt = 0
        } else if(status === 1 || status === 2) {//During in pass mission
            let now = new Date().toISOString()
            let diff = getDiff(start, now)
            toLog(3,'get diff :'+diff)
            countdown = pass_time - diff

            if(countdown <= 0) {
              status = 4
              countdown = 0
              roomObj['status'] = status
              file.saveJsonToFile(path, roomObj)
              redisClient.hsetValue(roomKey, 'status', status)
            
            } else if (currentSequence === count && status === 2 && countdown > 0) {
              status = 3
              countdown = 0
              roomObj['status'] = status
              file.saveJsonToFile(path, roomObj)
              redisClient.hsetValue(roomKey, 'status', status)
            }
            toLog(4, 'get countdown :'+countdown)
        } else if(status ===10 || status === 11){
            countdown = 0;
            currentSequence = 0
        }
        
        redisClient.quit()
        
        let data = {"team_id":team_id,"countdown":countdown,"sequence":currentSequence,"status":status, "reduce":reduce, "prompt":prompt}
        toLog(5,'response 200')
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
}

function setDefaultStatus(_client, _key) {
  _client.hsetValue(_key, 'sequence', 0)
  _client.hsetValue(_key, 'status', 0)
  _client.hsetValue(_key, 'team_id', 0)
  _client.hsetValue(_key, 'countdown', 0)
  _client.hsetValue(_key, 'reduce', 0)
  _client.hsetValue(_key, 'prompt', 0)
}

async function setMissionStop(_req, _res, _status, _message) {
  try {
    let input = checkInput(_req, ['room_id'])
  
    if(input === null) {
      toLog('','@@ miss param')
      return missParam(_res, 'getMissionData', 'miss param')
    }
    //let user_id = parseInt(input.user_id)
    let room_id = parseInt(input.room_id)
    let roomKey = 'room'+room_id
    let path = roomPath+room_id+'.json'
    let roomObj = file.getJsonFromFile(path)
    //Connect redis
    
    let redisClient = new redisHandler(0)
    redisClient.connect()
    let doorMac = await redisClient.hgetValue(roomKey, 'doorMac')
    let currentSequence = await redisClient.hgetValue(roomKey, 'sequence')
    let count = await redisClient.hgetValue(roomKey, 'count')
    let macs =  await redisClient.hgetValue(roomKey, 'macs')
    let currentStatus = await redisClient.hgetValue(roomKey, 'status')
    toLog(2,'get sequence, count , macs from redis')
    console.log('currentSequence:'+currentSequence+ ', count:'+count+', macs'+macs)
    if(currentSequence === null) {//Check redis value
      toLog('','@@ from redis null')
      currentSequence = roomObj['sequence']
      count = roomObj['count']
      macs = roomObj['macs']
      currentStatus = roomObj['status']
      doorMac = roomObj['doorMac']
    }

    if(typeof currentSequence === 'string') {
      currentSequence = parseInt(currentSequence)
      count = parseInt(count)
      macs = JSON.parse(macs)
      currentStatus = parseInt(currentStatus)
    }

    if(currentSequence === null) {//Check sequence
      toLog('','@@ from file null')
      return notAllowed(_res, 'setMissionStop', 'Mission not action yet')
    }
    

    if(currentStatus > 2) {//Check status from redis
      return notAllowed(_res, 'setMissionStop', 'Mission not action yet')
    }
    
    let mac = macs[(currentSequence-1)]
    toLog(3,'last mac :'+ mac)
    let end = new Date().toISOString()
    toLog(4,'end :'+ end)
    
    if(true) {
      toLog(5,'Before save record')
      let result1 = await saveRecord(redisClient, room_id, mac, end)
      toLog(5,'After save record')
      toLog(6,'Before save team record')
      let result2 = await saveTeamRecord(redisClient, room_id, _status, end)
      toLog(6,'After save team record')
    }
    //setMissionEnd update status,end time ------------------------------


    redisClient.hsetValue(mac, 'end', end)
    redisClient.hsetValue(roomKey, 'end', end)
    redisClient.hsetValue(roomKey, 'status', _status)
    roomObj['status'] = _status
    roomObj['end'] = end
    file.saveJsonToFile(path, roomObj)
    
    redisClient.quit()
    //Set door open 21
    let doorObj = getMqttObject( doorMac, code.node_on_command, end, 1)
    //Save mac command to report
    //dataResources.saveReport(doorObj)
    sendMqttMessage(socket, doorObj, 0)
    
    //Set end node to web
    let cmdObj = getMqttObject( mac, _status, end, 1)
    //Send socket to web
    sendSocketCmd(socket, cmdObj)
    //Command 24: 停止 node
    let cmd = code.stop_command
    if(_status === 4 || _status === 3) {//over time
      cmd = code.stop_command
    } else if(_status === 6){
      cmd = code.emergency_stop_command
    }
    for(let k=0;k<macs.length;k++) {
      let endNodeObj = getMqttObject( macs[k], cmd, end, 1)
      sendMqttMessage(socket, endNodeObj, (k+1)*500)
    }
    
    //Save node status 2 to DB
    toLog(7,'Before save report')
    let result = await dataResources.saveReport(cmdObj)
    toLog(7,'After save report')
    
    if(result.id > 0) {
      toLog('','**** save report success')
    }
    toLog(8,'Response 200')
    resResources.doSuccess(_res, _message)
  } catch (error) {
    toLog(8,'@@ response 500 :'+error.message)
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
      tolog('','@@ checkInput fail')
      return null
    } else {
      toLog('','@@ checkInput')
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
    _client.hsetValue('room'+_roomId, 'mission_id', _mission_id)
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

async function saveRecord(_client, _roomId, _mac, _end) {
  let _key = 'room'+ _roomId
  let team_id = await _client.hgetValue(_key, 'team_id')
  let mission_id = await _client.hgetValue(_mac, 'mission_id')
  let _start = await _client.hgetValue(_mac, 'start')
  let _diff = getDiff(_start,_end)
  let saveObj = {
    "team_id": team_id,
    "room_id": _roomId,
    "mission_id": mission_id,
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
  let _diff = getDiff(_start, _end)
  
  let mission_id = await _client.hgetValue(myKey, 'mission_id')
  
  let saveObj = {
    "team_id": team_id,
    "room_id": _id,
    "cp_id": team.cp_id,
    "total_time": _diff,
    "total_score": 0,
    "status" : _status,
    "mission_id": mission_id
  }
  return dataResources.createTeamRecord(saveObj)
}

function getDiff(start_time, end_tme) {
  let new1 = Date.parse(start_time)
  let new2 = Date.parse(end_tme)
  //最小整數
  //let timestamp = Math.ceil((new2-new1)/1000)
  //Math.floor() 最大整數
  let timestamp = Math.floor((new2-new1)/1000)
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
  let redisClient = new redisHandler(0)
  redisClient.connect()
  let room_id = await redisClient.hgetValue(macAddr, 'room_id')
  let roomKey = 'room'+room_id
  if(command === code.door_off_notify) {
    toLog(2, 'door_off_notify')
    let doorStatus = await redisClient.hgetValue(macAddr, 'door')
    if(doorStatus) doorStatus = parseInt(doorStatus)
    if(doorStatus === code.door_on_notify) {
      //表示大門開啟過,然後上報關閉,表示進入可啟動模式 ,若要開啟輔助照明可於此開啟
      //存到Redis
      redisClient.hsetValue(macAddr, 'door', code.door_off_notify)
      redisClient.hsetValue(roomKey, 'status', code.door_off_notify)
      //收到 MQTT時就存到DB
      toLog(3, 'save door status door_off_notify :' + code.door_off_notify)
    } else {
      setDefaultStatus(redisClient, roomKey)
    }
  } else if(command === code.emergency_stop) {
    try {
      toLog(2, 'emergency_stop')
      let status = code.emergency_stop
      let doorMac = macAddr
      let room_id = await redisClient.hgetValue(macAddr, 'room_id')
      if(room_id === null) room_id = 1
      let path = roomPath+room_id+'.json'
      let roomObj = file.getJsonFromFile(path)
      let roomKey = 'room'+room_id
      let currentSequence = await redisClient.hgetValue(roomKey, 'sequence')
      let count = await redisClient.hgetValue(roomKey, 'count')
      let macs =  await redisClient.hgetValue(roomKey, 'macs')
      let currentStatus = await redisClient.hgetValue(roomKey, 'status')
      if(currentStatus === null) {//Check redis value
        toLog('','@@ from redis null')
        currentSequence = roomObj['sequence']
        count = roomObj['count']
        macs = roomObj['macs']
        currentStatus = roomObj['status']
      }
      if(typeof currentStatus === 'string') {
        currentSequence = parseInt(currentSequence)
        currentStatus = parseInt(currentStatus)
        if(count)
          count = parseInt(count)
        if(macs)
          macs = JSON.parse(macs)
      }
      toLog(3,'currentSequence :'+ currentSequence + ', currentStatus :'+currentStatus)
      if(currentSequence === 0) {
        redisClient.hsetValue(roomKey, 'status', status)
        redisClient.quit()
        return 
      }
      
      let mac = macs[(currentSequence-1)]
      toLog(4,'last mac :'+ mac)
      let end = new Date().toISOString()
      toLog(5,'end :'+ end)
      if(true) {
        toLog(6,'Before save record')
        let result1 = await saveRecord(redisClient, room_id, mac, end)
        toLog(6,'After save record')
        toLog(7,'Before save team record')
        let result2 = await saveTeamRecord(redisClient, room_id, status, end)
        toLog(7,'After save team record')
      }
      //setMissionEnd update status,end time ------------------------------

      redisClient.hsetValue(mac, 'end', end)
      redisClient.hsetValue(roomKey, 'end', end)
      redisClient.hsetValue(roomKey, 'status', status)
      roomObj['status'] = status
      roomObj['end'] = end
      file.saveJsonToFile(path, roomObj)

      //Set end node to web
      let cmdObj = getMqttObject( mac, code.emergency_stop, end, 1)
      //Send MQTT to node
      sendSocketCmd(socket, cmdObj)
      for(let k=0;k<macs.length;k++) {
        let endNodeObj = getMqttObject( macs[k], code.emergency_stop_command, end, 1)
        sendMqttMessage(socket, endNodeObj, (k+1)*500)
      }
    } catch (error) {
      toLog('','@@ emergency_stop error:'+error.message)
    }
  }
  redisClient.quit()
}