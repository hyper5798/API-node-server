'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('team_records', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      team_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      room_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      cp_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      total_time: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      reduce: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      status: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      sequence: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      start: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      end: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('team_records');
  }
};