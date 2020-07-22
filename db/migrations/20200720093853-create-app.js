'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('apps', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      macAddr: {
        allowNull: false,
        type: Sequelize.STRING
      },
      api_key: {
        allowNull: false,
        type: Sequelize.STRING
      },
      key_label: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      key_parse: {
        type: Sequelize.TEXT
      },
      description: {
        type: Sequelize.STRING
      },
      image_url: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE
      },
      updated_at: {
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('apps');
  }
};