'use strict';
module.exports = (sequelize, DataTypes) => {
  const team_record = sequelize.define('team_record', {
    team_id: DataTypes.INTEGER,
    room_id: DataTypes.INTEGER,
    cp_id: DataTypes.INTEGER,
    total_time: DataTypes.INTEGER,
    total_score: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    mission_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  team_record.associate = function(models) {
    // associations can be defined here
  };
  return team_record;
};