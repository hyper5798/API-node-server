'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('commands', [{
      type_id: '22',
      cmd_name: '馬達開',
      command: 'fc000102030405060708',
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
