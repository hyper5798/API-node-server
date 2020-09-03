'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Teams', [{
      name: '勇往向前',
      cp_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      name: '不可思議',
      cp_id: 1,
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
