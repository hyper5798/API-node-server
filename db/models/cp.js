'use strict';
module.exports = (sequelize, DataTypes) => {
  const Cp = sequelize.define('Cp', {
    cp_name: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  Cp.associate = function(models) {
    // associations can be defined here
  };
  return Cp;
};