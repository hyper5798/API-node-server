'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('products', [{
      macAddr: 'fcf5c4536490',
      description: '公司實驗板',
      created_at: new Date(),
      updated_at: new Date()
    },{
      macAddr: 'fcf5c453649a',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      macAddr: 'fcf5c4536491',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      macAddr: 'fcf5c4536492',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      macAddr: 'fcf5c4536493',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      macAddr: 'fcf5c4536494',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      macAddr: 'fcf5c4536495',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      macAddr: 'fcf5c4536496',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      macAddr: 'fcf5c4536497',
      description: '密室脫逃測試',
      created_at: new Date(),
      updated_at: new Date()
    },{
      macAddr: 'fcf5c4536498',
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
