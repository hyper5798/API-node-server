module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('scripts', [{
      script_name: 's1-1',
      mission_id: 1,
      content: '射擊烏雲1',
      prompt: '連擊1次',
	    pass:'{"code": "12345"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's1-2',
      mission_id: 1,
      content: '射擊烏雲2',
      prompt: '連擊2次',
	  pass:'{"code": "54321"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's1-3',
      mission_id: 1,
      content: '射擊烏雲3',
      prompt: '連擊3次',
	    pass:'{"code": "98745"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's2-1',
      mission_id: 2,
      content: '投籃1',
      prompt: '投進1次',
	    pass:'{"key": 1}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's2-2',
      mission_id: 2,
      content: '投籃2',
      prompt: '投進2次',
	    pass:'{"key": 2}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's2-3',
      mission_id: 2,
      content: '投籃3',
      prompt: '投進3次',
	    pass:'{"key": 3}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's3-1',
      mission_id: 3,
      content: '打鼓1',
      prompt: '連擊1次',
	    pass:'{"code": "98745"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's3-2',
      mission_id: 3,
      content: '打鼓2',
      prompt: '連擊2次',
	    pass:'{"code": "65781"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's3-3',
      mission_id: 3,
      content: '打鼓3',
      prompt: '連擊3次',
	    pass:'{"code": "98745"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's4-1',
      mission_id: 4,
      content: '射箭1',
      prompt: '連擊1次',
	    pass:'{"code": "98745"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's4-2',
      mission_id: 4,
      content: '射箭2',
      prompt: '連擊2次',
	    pass:'{"code": "65781"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's4-3',
      mission_id: 4,
      content: '射箭3',
      prompt: '連擊3次',
	    pass:'{"code": "98745"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's5-1',
      mission_id: 5,
      content: '敲鑼1',
      prompt: '連擊1次',
	    pass:'{"code": "27846"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's5-2',
      mission_id: 5,
      content: '敲鑼2',
      prompt: '連擊2次',
	    pass:'{"code": "36589"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's5-3',
      mission_id: 5,
      content: '敲鑼3',
      prompt: '連擊3次',
	    pass:'{"code": "69874"}',
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