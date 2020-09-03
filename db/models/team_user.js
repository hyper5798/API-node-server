'use strict';
module.exports = (sequelize, DataTypes) => {
  const team_user = sequelize.define('team_user', {
    team_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    room_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  team_user.associate = function(models) {
    // associations can be defined here
  };
  return team_user;
};
