'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('api_users', [{
      name: 'test',
      email: 'example@example.com',
      password: 'example@example.com',
      cp_id: 1,
      role_id: 1,
      email_verified_at: null,
      remember_token: null,
      active: 1,
      createdAt: new Date(),
      updatedAt: new Date()
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
