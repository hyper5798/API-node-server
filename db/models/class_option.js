'use strict';
module.exports = (sequelize, DataTypes) => {
  const Class_option = sequelize.define('Class_option', {
    option_name: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  Class_option.associate = function(models) {
    // associations can be defined here
  };
  return Class_option;
};