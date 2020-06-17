'use strict';
module.exports = (sequelize, DataTypes) => {
  const role = sequelize.define('role', {
    role_id: DataTypes.INTEGER,
    role_name: DataTypes.STRING,
    dataset: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, { 
    timestamps: false
  });
  role.associate = function(models) {
    // associations can be defined here
  };
  return role;
};