'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('scripts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      script_name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      mission_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      room_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      content: {
        allowNull: false,
        type: Sequelize.STRING
      },
      prompt1: {
        allowNull: true,
        type: Sequelize.STRING
      },
      prompt2: {
        allowNull: true,
        type: Sequelize.STRING
      },
      prompt3: {
        allowNull: true,
        type: Sequelize.STRING
      },
      pass: {
        allowNull: true,
        type: Sequelize.STRING
      },
      next_pass: {
        allowNull: true,
        type: Sequelize.STRING
      },
      next_sequence: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      note: {
        allowNull: true,
        type: Sequelize.STRING
      },
      image_url: {
        allowNull: true,
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
    return queryInterface.dropTable('scripts');
  }
};