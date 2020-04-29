'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Types', [{
      type_id: 99,
      type_name: '壽豐養蜂溫濕度',
      description: '溫度度感測裝置',
      image_url: null,
      rules: '{"temperature":[14,18,"data/10"],"humidity":[18,22,"data/10"]}',
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  }
};
