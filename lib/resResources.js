/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict';
let json = {}
let isNetStatus = false

function outResponse(res, code, message, data) {
  json = {}
  if(isNetStatus == false){
    json.code = code
    if(message != null)
    json.message  = message
    if(data != null)
        json['data'] = data
    res.status(200).json(json)
  } else {
    if(message != null)
        json.message = message
    if(data != null)
        json.data = data
    res.status(code).json(json)
  }
}

module.exports = {
    /**
     * @param pwd       The data to be encrypted.
     * @param hashPwd   The data to be replace laravel format and compared against.
     * @return          A promise to be either resolved with the comparision result salt or rejected with an Error
     */

    missPara(res, message) {
      outResponse(res, 400, message ||'Miss parameter', null)
    },

    authFail(res) {
      outResponse(res, 401, 'Auth fail', null)
    },

    noAccess(res) {
      outResponse(res, 403, 'No access token', null)
    },

    notAllowed(res, message) {
      outResponse(res, 405, message || 'Not allowed', null)
    },

    notFound(res, message) {
      outResponse(res, 404, message || 'Not found', null)
    },

    doSuccess(res, message) {
      outResponse(res, 200, message, null)
    },

    getDtaSuccess(res, data) {
      outResponse(res, 200, null, data)
    },

    catchError(res, message) {
      outResponse(res, 500, message, null)
    },


}