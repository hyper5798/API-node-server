'use strict';
module.exports = (sequelize, DataTypes) => {
  const class_option = sequelize.define('class_option', {
    option_name: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, { 
    timestamps: false
  });
  class_option.associate = function(models) {
    // associations can be defined here
  };
  return class_option;
};