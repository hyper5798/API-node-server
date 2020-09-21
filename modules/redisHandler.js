const Redis = require('redis')
const Bluebird = require('bluebird')
const Promise = require('bluebird')
const appConfig = require('../config/app.json')
Bluebird.promisifyAll(Redis.RedisClient.prototype)
Bluebird.promisifyAll(Redis.Multi.prototype)
let options = {
  "host": 'localhost' ,
  "port": 6379,
  "db": 0
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
      console.log('Connected redis')
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
    return Promise.resolve(this.redisClient.hsetAsync(key, field, value))
  }

  hgetValue(key,field) {
    key = appConfig.laravel_prifix+key
    /*let value = this.redisClient.hgetAsync(key, field)
    //console.log('hgetValue :' + value);
    return Promise.resolve(value)*/
    return Promise.resolve(this.redisClient.hgetAsync(key, field))
  }

  remove(key) {
    let result = this.redisClient.del(key)
    return Promise.resolve(result)
  }

  flush() {
    let result = this.redisClient.flushallAsync()
    return Promise.resolve(result)
  }
}

module.exports = redisHandler