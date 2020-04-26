'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', [{
      name: 'tom',
      email: 'demo@example.com',
      password: '$2y$10$Ag/eqqkUDkaW0hTqcFY/XucsoROHOOBvd1d4cByrz2MLXIFIMix5.',
      cp_id: 1,
      role_id: 1,
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
