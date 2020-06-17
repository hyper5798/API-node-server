'use strict';
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    cp_id: DataTypes.INTEGER,
    role_id: DataTypes.INTEGER,
    email_verified_at: DataTypes.DATE,
    remember_token: DataTypes.STRING,
    active: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, { 
    timestamps: false
  });
  user.associate = function(models) {
    // associations can be defined here
  };
  return user;
};