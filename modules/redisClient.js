const Redis = require('redis')
const Bluebird = require('bluebird')
Bluebird.promisifyAll(Redis.RedisClient.prototype)
Bluebird.promisifyAll(Redis.Multi.prototype)
/*const redis_config = {
  "host": "127.0.0.1",
  "port": 6379,
  "db": 0
};*/

let client = Redis.createClient()

client
  .on('connect', function () {
    console.log('Connected redis')
  })

module.exports = client