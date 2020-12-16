'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('reports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequlieze.INTEGER(20).UNSIGNED
      },
      macAddr: {
        allowNull: false,
        type: Sequelize.STRING
      },
      type_id: {
        type: Sequelize.INTEGER
      },
      key1: {
        type: Sequelize.FLOAT
      },
      key2: {
        type: Sequelize.FLOAT
      },
      key3: {
        type: Sequelize.FLOAT
      },
      key4: {
        type: Sequelize.FLOAT
      },
      key5: {
        type: Sequelize.FLOAT
      },
      key6: {
        type: Sequelize.FLOAT
      },
      key7: {
        type: Sequelize.FLOAT
      },
      key8: {
        type: Sequelize.FLOAT
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