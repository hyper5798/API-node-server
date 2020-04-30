'use strict';
module.exports = (sequelize, DataTypes) => {
  const Group - option = sequelize.define('Group-option', {
    option_name: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  Device.associate = function(models) {
    // associations can be defined here
  };
  return Group - option;
};