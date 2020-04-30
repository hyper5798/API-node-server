'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Group_options', [{
      option_name: '僅有組員',
      created_at: new Date(),
      updated_at: new Date()
    },{
      option_name: '僅有裝置',
      created_at: new Date(),
      updated_at: new Date()
    },{
      option_name: '有組員及裝置',
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
