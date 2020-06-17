'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('classes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      class_name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      cp_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      class_option: {
        allowNull: false,
        defaultValue: 1, //1:only member, 2:only device, 3:Both
        type: Sequelize.INTEGER
      },
      members: {
        type: Sequelize.TEXT
      },
      devices: {
        type: Sequelize.TEXT
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
    return queryInterface.dropTable('classes');
  }
};