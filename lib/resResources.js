/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict';
let json = {}
let isNetStatus = false

function outResponse(res, code, message, data) {
  
  if(isNetStatus == false){
    json['code'] = code
    if(message != null)
    json['message']  = message
    if(data != null)
        json['data'] = data
    res.status(200).json(json)
  } else {
    if(message != null)
        json.message = message
    if(data != null)
        json['data'] = data
    res.status(code).json(json)
  }
  
  return 
}

module.exports = {
    /**
     * @param pwd       The data to be encrypted.
     * @param hashPwd   The data to be replace laravel format and compared against.
     * @return          A promise to be either resolved with the comparision result salt or rejected with an Error
     */

    missPara(res) {
      outResponse(res, 400, 'Miss parameter', null)
    },

    authFail(res) {
      outResponse(res, 401, 'Auth fail', null)
    },

    noAccess(res) {
      outResponse(res, 403, 'No access', null)
    },

    notAllowed(res) {
      outResponse(res, 405, 'Not allowed', null)
    },

    notFound(res, message) {
      outResponse(res, 406, message, null)
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