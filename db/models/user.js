'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    cp_id: DataTypes.INTEGER,
    role_id: DataTypes.INTEGER,
    email_verified_at: DataTypes.DATE,
    remember_token: DataTypes.STRING,
    active: DataTypes.INTEGER
  }, {});
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};