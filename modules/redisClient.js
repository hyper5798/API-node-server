var Redis = require('redis')
var Bluebird = require('bluebird')
Bluebird.promisifyAll(Redis.RedisClient.prototype)
Bluebird.promisifyAll(Redis.Multi.prototype)

var client = Redis.createClient()

client
  .on('connect', function () {
    console.log('connected')
  })

module.exports = client