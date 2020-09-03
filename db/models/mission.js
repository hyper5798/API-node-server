'use strict';
module.exports = (sequelize, DataTypes) => {
  const mission = sequelize.define('mission', {
    mission_name: DataTypes.STRING,
    room_id: DataTypes.INTEGER,
    game_id: DataTypes.INTEGER,
    device_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  mission.associate = function(models) {
    // associations can be defined here
  };
  return mission;
};