'use strict';
module.exports = (sequelize, DataTypes) => {
  const cp = sequelize.define('cp', {
    cp_name: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, { 
    timestamps: false
  });
  cp.associate = function(models) {
    // associations can be defined here
  };
  return cp;
};