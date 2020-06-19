const Redis = require('redis')
const Bluebird = require('bluebird')
Bluebird.promisifyAll(Redis.RedisClient.prototype)
Bluebird.promisifyAll(Redis.Multi.prototype)
const redis_config = {
  "host": 'localhost' ,
  "port": 6379,
  "db": 1
};

let client = Redis.createClient(redis_config)

client
  .on('connect', function () {
    console.log('Connected redis')
  })

module.exports = client