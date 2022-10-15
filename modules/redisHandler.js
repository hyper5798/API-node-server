const Redis = require('redis')

const Promise = require('bluebird')
const appConfig = require('../config/app.json')
Promise.promisifyAll(Redis.RedisClient.prototype)
Promise.promisifyAll(Redis.Multi.prototype)
let options = {
  "host": 'localhost' ,
  "port": 16379,
  "db": 0,
  "auth_pass": "yesio12345"
};

class redisHandler {
  constructor(db) {
    this.redisClient = null;
    this.db = db;
  }

  connect() {
    options.db = this.db
    this.redisClient = Redis.createClient(options)

    this.redisClient.on('connect', function () {
      //console.log('Connected redis')
    })

    this.redisClient.on('disconnect', function () {
      console.log('???? Redis disconnect on'+new Date().toISOString)
    })

    this.redisClient.on('error', function (err) {
      console.log('???? '+err+' on '+new Date().toISOString)
    })
  }

  setValue(key,value) {
    key = appConfig.laravel_prifix+key
    let result = this.redisClient.setAsync(key, value);
    return Promise.resolve(result)
  }

  getValue(key) {
    key = appConfig.laravel_prifix+key
    let value = this.redisClient.getAsync(key)
    return Promise.resolve(value)
  }

  hsetValue(key,field,value) {
    key = appConfig.laravel_prifix+key
    /*let result = this.redisClient.hsetAsync(key, field, value)
    return Promise.resolve(result)*/
    //return Promise.resolve(this.redisClient.hsetAsync(key, field, value))
    return new Promise((resolve,reject)=>{
      this.redisClient.hset(key, field, value, function(error, res){
        if (error) {
          console.log("hsetValue error : ");
          console.log(error);
          resolve(false) // or use rejcet(false) but then you will have to handle errors
        } 
        else {
          //console.log('hsetValue ok'+ key + ' : ' + field);
          resolve(true)
        }
      })
    })
  }

  hgetValue(key,field) {
    key = appConfig.laravel_prifix+key
    /*let value = this.redisClient.hgetAsync(key, field)
    //console.log('hgetValue :' + value);
    return Promise.resolve(value)*/
    //return Promise.resolve(this.redisClient.hgetAsync(key, field))
    return new Promise((resolve,reject)=>{
      this.redisClient.hget(key, field, function(error, res){
        if (error) {
          console.log("hgetValue error : ");
          console.log(error);
          resolve(null) // or use rejcet(false) but then you will have to handle errors
        } 
        else {
          //console.log('hgetValue ok'+ key + ' : ' + field);
          resolve(res)
        }
      })
    })
  }

  hgetall(key) {
    key = appConfig.laravel_prifix+key
  
    return new Promise((resolve,reject)=>{
      this.redisClient.hgetall(key, function(error, res){
        if (error) {
          console.log("hgetValue error : ");
          console.log(error);
          resolve(null) // or use rejcet(false) but then you will have to handle errors
        } 
        else {
          //console.log('hgetValue ok'+ key + ' : ' + field);
          resolve(res)
        }
      })
    })
  }

  hdel(key, field) {
    let mkey = appConfig.laravel_prifix+key
    //let result = this.redisClient.del(key)
    //return Promise.resolve(result)
    return new Promise((resolve,reject)=>{
      this.redisClient.hdel(mkey, field, function(error, res){
        if (error) {
          console.log("del key error : ");
          console.log(error);
          resolve(null) // or use rejcet(false) but then you will have to handle errors
        } 
        else {
          //console.log('del key  ok');
          resolve(res)
        }
      })
    })
  }

  remove(key) {
    let mkey = appConfig.laravel_prifix+key
    //let result = this.redisClient.del(key)
    //return Promise.resolve(result)
    return new Promise((resolve,reject)=>{
      this.redisClient.del(mkey, function(error, res){
        if (error) {
          console.log("del key error : ");
          console.log(error);
          resolve(null) // or use rejcet(false) but then you will have to handle errors
        } 
        else {
          //console.log('del key  ok');
          resolve(res)
        }
      })
    })
  }

  flush() {
    let result = this.redisClient.flushallAsync()
    return Promise.resolve(result)
  }

  quit() {
    this.redisClient.quit()
  }
}

module.exports = redisHandler