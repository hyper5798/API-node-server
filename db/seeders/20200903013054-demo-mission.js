'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('missions', [{
      mission_name: 'm1',
      room_id: 1,
      device_id: 1,
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      mission_name: 'm2',
      room_id: 1,
      device_id: 2,
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      mission_name: 'm3',
      room_id: 1,
      device_id: 3,
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      mission_name: 'm4',
      room_id: 1,
      device_id: 4,
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      mission_name: 'm5',
      room_id: 1,
      device_id: 5,
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
