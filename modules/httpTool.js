const axios = require('axios').default
const appConfig = require('../config/app.json')

module.exports = {
    post
}

//Send report to strapi test
async function post(url,json) {
    url = appConfig.mongodb_api + url
    const Promise = require('bluebird')

    return new Promise((resolve,reject)=>{
        axios.post(url, json)
          .then(function (response) {
            resolve(response)
          })
          .catch(function (error) {
            resolve(error)
          })
    })
  }