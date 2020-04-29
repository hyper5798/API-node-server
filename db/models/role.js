'use strict';
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    role_id: DataTypes.INTEGER,
    role_name: DataTypes.STRING,
    dataset: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  Role.associate = function(models) {
    // associations can be defined here
  };
  return Role;
};