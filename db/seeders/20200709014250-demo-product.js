'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('products', [{
      type_id: 11,
      macAddr: 'fcf5c4536490',
      description: '公司實驗板',
      created_at: new Date(),
      updated_at: new Date()
    },{
      type_id: 99,
      macAddr: 'fcf5c4536480',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      type_id: 99,
      macAddr: 'fcf5c4536481',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      type_id: 99,
      macAddr: 'fcf5c4536482',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      type_id: 99,
      macAddr: 'fcf5c4536483',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      type_id: 99,
      macAddr: 'fcf5c4536484',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      type_id: 99,
      macAddr: 'fcf5c4536485',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      type_id: 99,
      macAddr: 'fcf5c4536486',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      type_id: 99,
      macAddr: 'fcf5c4536487',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      type_id: 99,
      macAddr: 'fcf5c4536488',
      description: '密室脫逃測試',
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
