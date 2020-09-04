'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('team_users', [{
      team_id: 1,
      user_id: 1,
      room_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      team_id: 1,
      user_id: 2,
      room_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      team_id: 1,
      user_id: 3,
      room_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      team_id: 1,
      user_id: 4,
      room_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      team_id: 1,
      user_id: 5,
      room_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      team_id: 2,
      user_id: 6,
      room_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      team_id: 2,
      user_id: 7,
      room_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      team_id: 2,
      user_id: 8,
      room_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      team_id: 2,
      user_id: 9,
      room_id: 1,
      created_at: new Date(),
      updated_at: new Date()
    },{
      team_id: 2,
      user_id: 10,
      room_id: 1,
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
