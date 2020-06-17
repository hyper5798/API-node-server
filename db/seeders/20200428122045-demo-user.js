'use strict';
const bcrypt = require('bcrypt')
const saltRounds = 10

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('users', [{
      name: 'Manager',
      email: 'admin@admin.com',
      password: '$2y$10$G2ItdtEaiZAFEMjeueHEWes7f/1RvKZ7SAkdK7oU.dDBGpoGaMxvy',
      cp_id: 1,
      role_id: 1,
      email_verified_at: null,
      remember_token: null,
      active: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      name: 'MIT',
      email: 'admin2@admin.com',
      password: '$2y$10$G2ItdtEaiZAFEMjeueHEWes7f/1RvKZ7SAkdK7oU.dDBGpoGaMxvy',
      cp_id: 1,
      role_id: 2,
      email_verified_at: null,
      remember_token: null,
      active: 1,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  }
};


