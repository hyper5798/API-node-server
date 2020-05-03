'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Reports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      macAddr: {
        allowNull: false,
        type: Sequelize.STRING
      },
      type_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      data: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      extra: {
        type: Sequelize.TEXT
      },
      recv: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Reports');
  }
};