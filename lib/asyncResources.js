/*******************************************************************************
 * Copyright (c) 2020 Jason Huang
 ******************************************************************************/

'use strict';

module.exports = {

    getAsyncResources() {
      return new Promise((resolve) => {
          setTimeout(() => {
            resolve([
              {
                firstName: "Nick",
                lastName: "Naso"
              },
              {
                firstName: "Steve",
                lastName: "Jobs"
              },
              {
                firstName: "Ryan",
                lastName: "Dahl"
              }
            ])
          }, 1000)
      })
    },

    createAysncResource(resource) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            firstName: resource.firstName,
            lastName: resource.lastName
          })
        }, 1000)
      })
    },

    updateAsyncResource(resource) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            firstName: resource.firstName,
            lastName: resource.lastName
          })
        }, 1000)
      })
    },

    deleteAsyncResources(resource) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            firstName: resource.firstName,
            lastName: resource.lastName
          })
        }, 1000)
      })
    }

}
