'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('classes', [{
      class_name: '養蜂班',
      cp_id: 1,
      class_option: 1,//only members
      members: '["1","2","3"]',
      devices: null,
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
