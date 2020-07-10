'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('commands', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      device_id: {
        type: Sequelize.INTEGER
      },
      cmd_name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      command: {
        allowNull: false,
        type: Sequelize.STRING
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
    return queryInterface.dropTable('commands');
  }
};
