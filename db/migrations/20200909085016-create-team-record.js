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
      total_score: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      status: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      mission_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      created_at: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
      },
      updated_at: {
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