'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Roles', [{
      role_id: 1,
      role_name: 'Super Admin',
      dataset: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      role_id: 2,
      role_name: 'Local Admin',
      dataset: 2,
      created_at: new Date(),
      updated_at: new Date()
    },{
      role_id: 8,
      role_name: 'Normal User',
      dataset: 8,
      created_at: new Date(),
      updated_at: new Date()
    },{
      role_id: 9,
      role_name: 'Guest',
      dataset: 9,
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
