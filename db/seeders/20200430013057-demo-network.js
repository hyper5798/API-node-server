'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Networks', [{
      network_name: 'Wifi',
      created_at: new Date(),
      updated_at: new Date()
    },{
      network_name: 'Bluetooth',
      created_at: new Date(),
      updated_at: new Date()
    },{
      network_name: 'Lora',
      created_at: new Date(),
      updated_at: new Date()
    },{
      network_name: 'NOIOT',
      created_at: new Date(),
      updated_at: new Date()
    },{
      network_name: 'Zigbee',
      created_at: new Date(),
      updated_at: new Date()
    },{
      network_name: 'Internet',
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
