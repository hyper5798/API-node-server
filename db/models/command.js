'use strict';
module.exports = (sequelize, DataTypes) => {
  const command = sequelize.define('command', {
    type_id: DataTypes.INTEGER,
    cmd_name: DataTypes.STRING,
    command: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, { 
    //為了不使用預設的createAt,updateAt,跟laravel不同
    timestamps: false 
  });
  command.associate = function(models) {
    // associations can be defined here
  };
  return command;
};
