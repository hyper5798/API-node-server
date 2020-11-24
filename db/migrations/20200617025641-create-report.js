'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('reports', {
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
        type: Sequelize.INTEGER
      },
      key1: {
        type: Sequelize.INTEGER
      },
      key2: {
        type: Sequelize.INTEGER
      },
      key3: {
        type: Sequelize.INTEGER
      },
      key4: {
        type: Sequelize.INTEGER
      },
      key5: {
        type: Sequelize.INTEGER
      },
      key6: {
        type: Sequelize.INTEGER
      },
      key7: {
        type: Sequelize.INTEGER
      },
      key8: {
        type: Sequelize.INTEGER
      },
      data: {
        type: Sequelize.TEXT
      },
      extra: {
        type: Sequelize.TEXT
      },
      app_id: {
        type: Sequelize.STRING
      },
      recv: {
        type: Sequelize.DATE(3),
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('reports');
  }
};