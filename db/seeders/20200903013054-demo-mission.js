'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('missions', [{
      mission_name: 'm1',
      order: 1,
      room_id: 1,
      device_id: 1,
      user_id: 1,
      macAddr: 'fcf5c4536480',
      created_at: new Date(),
      updated_at: new Date()
    },{
      mission_name: 'm2',
      order: 2,
      room_id: 1,
      device_id: 2,
      macAddr: 'fcf5c4536481',
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      mission_name: 'm3',
      order: 3,
      room_id: 1,
      device_id: 3,
      macAddr: 'fcf5c4536482',
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      mission_name: 'm4',
      order: 4,
      room_id: 1,
      device_id: 4,
      macAddr: 'fcf5c4536483',
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      mission_name: 'm5',
      order: 5,
      room_id: 1,
      device_id: 5,
      macAddr: 'fcf5c4536484',
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      mission_name: '緊急按鈕',
      order: 0,
      room_id: 1,
      device_id: 6,
      macAddr: 'fcf5c4536485',
      user_id: 1,
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
