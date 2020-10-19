module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('scripts', [{
      script_name: 's1-1',
      mission_id: 1,
      room_id: 1,
      content: '射擊烏雲1',
      prompt1: '找尋槍',
      prompt2: '找尋烏雲',
      prompt3: '連擊1次',
      pass:'12345',
      next_sequence: 2,
      next_pass: '9999',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's1-2',
      mission_id: 1,
      room_id: 1,
      content: '射擊烏雲2',
      prompt1: '找尋槍',
      prompt2: '找尋烏雲',
      prompt3: '連擊2次',
      pass:'54321',
      next_sequence: 2,
      next_pass: '8888',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's1-3',
      mission_id: 1,
      room_id: 1,
      content: '射擊烏雲3',
      prompt1: '找尋槍',
      prompt2: '找尋烏雲',
      prompt3: '連擊3次',
      pass:'98745',
      next_sequence: 2,
      next_pass: '7777',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's2-1',
      mission_id: 2,
      room_id: 1,
      content: '投籃1',
      prompt1: '找尋球',
      prompt2: '找尋籃框',
      prompt3: '投進1次',
      pass:'1',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's2-2',
      mission_id: 2,
      room_id: 1,
      content: '投籃2',
      prompt1: '找尋球',
      prompt2: '找尋籃框',
      prompt3: '投進2次',
      pass:'2',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's2-3',
      mission_id: 2,
      room_id: 1,
      content: '投籃3',
      prompt1: '找尋球',
      prompt2: '找尋籃框',
      prompt3: '投進3次',
      pass:'3',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's3-1',
      mission_id: 3,
      room_id: 1,
      content: '打鼓1',
      prompt1: '找尋鼓',
      prompt2: '找尋鼓棒',
      prompt3: '連擊1次',
      pass:'{"key":"code","value":"98745"}',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's3-2',
      mission_id: 3,
      room_id: 1,
      content: '打鼓2',
      prompt1: '找尋鼓',
      prompt2: '找尋鼓棒',
      prompt3: '連擊2次',
      pass:'65781',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's3-3',
      mission_id: 3,
      room_id: 1,
      content: '打鼓3',
      prompt1: '找尋鼓',
      prompt2: '找尋鼓棒',
      prompt3: '連擊3次',
      pass:'98745',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's4-1',
      mission_id: 4,
      room_id: 1,
      content: '射箭1',
      prompt1: '找尋弓箭',
      prompt2: '找尋箭靶',
      prompt3: '擊中紅心1次',
      pass:'98745',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's4-2',
      mission_id: 4,
      room_id: 1,
      content: '射箭2',
      prompt1: '找尋弓箭',
      prompt2: '找尋箭靶',
      prompt3: '擊中8分1次',
      pass:'65781',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's4-3',
      mission_id: 4,
      room_id: 1,
      content: '射箭3',
      prompt1: '找尋弓箭',
      prompt2: '找尋箭靶',
      prompt3: '擊中5分1次',
      pass:'98745',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's5-1',
      mission_id: 5,
      room_id: 1,
      content: '敲鑼1',
      prompt1: '找尋鑼',
      prompt2: '找尋鑼棒',
      prompt3: '連擊1次',
      pass:'27846',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's5-2',
      mission_id: 5,
      room_id: 1,
      content: '敲鑼2',
      prompt1: '找尋鑼',
      prompt2: '找尋鑼棒',
      prompt3: '連擊2次',
      pass:'36589',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 's5-3',
      mission_id: 5,
      room_id: 1,
      content: '敲鑼3',
      prompt1: '找尋鑼',
      prompt2: '找尋鑼棒',
      prompt3: '連擊3次',
      pass:'69874',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 'default1',
      mission_id: 6,
      room_id: 1,
      content: '組合開門密碼',
      prompt1: '找尋密碼表',
      prompt2: '大門右側',
      prompt3: '藏頭',
      pass:'27846',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 'default2',
      mission_id: 6,
      room_id: 1,
      content: '破解開門密碼',
      prompt1: '找尋密碼表',
      prompt2: '電線桿',
      prompt3: '去1加2',
      pass:'36589',
      created_at: new Date(),
      updated_at: new Date()
    },{
      script_name: 'default3',
      mission_id: 6,
      room_id: 1,
      content: '搜尋開門密碼',
      prompt1: '矮木叢數量',
      prompt2: '大門數量',
      prompt3: '電線杆數量',
      pass:'16868',
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
