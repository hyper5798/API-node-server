'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('reports', [{
      macAddr: 'fcf5c4536490',
      type_id: 99,
      data: '{"temperature":"29.10","humidity":"50.40"}',
      extra: null,
      recv: new Date().addHours(-(24*1))
    },{
      macAddr: 'fcf5c4536490',
      type_id: 99,
      data: '{"temperature":"29.10","humidity":"50.40"}',
      extra: null,
      recv: new Date().addHours(-(24*2))
    },{
      macAddr: 'fcf5c4536490',
      type_id: 99,
      data: '{"temperature":"29.10","humidity":"50.40"}',
      extra: null,
      recv: new Date().addHours(-(24*3))
    },{
      macAddr: 'fcf5c4536490',
      type_id: 99,
      data: '{"temperature":"29.10","humidity":"50.40"}',
      extra: null,
      recv: new Date().addHours(-(24*4))
    },{
      macAddr: 'fcf5c4536490',
      type_id: 99,
      data: '{"temperature":"29.10","humidity":"50.40"}',
      extra: null,
      recv: new Date().addHours(-(24*5))
    },{
      macAddr: 'fcf5c4536490',
      type_id: 99,
      data: '{"temperature":"29.10","humidity":"50.40"}',
      extra: null,
      recv: new Date().addHours(-(24*6))
    },{
      macAddr: 'fcf5c4536490',
      type_id: 99,
      data: '{"temperature":"29.10","humidity":"50.40"}',
      extra: null,
      recv: new Date().addHours(-(24*7))
    },{
      macAddr: 'fcf5c4536490',
      type_id: 99,
      data: '{"temperature":"29.10","humidity":"50.40"}',
      extra: null,
      recv: new Date().addHours(-(24*8))
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

Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}
