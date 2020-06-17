'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('devices', [{
      device_name: '壽豐養蜂場溫濕度計',
      macAddr: 'fcf5c45364990',
      status: 1,
      cp_id: 1,
      user_id: 2,
      type_id: 99,
      network_id:3,
      description: null,
      image_url: null,
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
