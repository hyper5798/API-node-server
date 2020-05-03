'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Groups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      group_name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      cp_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      group_option: {
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
        type: Sequelize.DATE
      },
      updated_at: {
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Groups');
  }
};