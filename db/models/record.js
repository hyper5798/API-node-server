'use strict';
module.exports = (sequelize, DataTypes) => {
  const record = sequelize.define('record', {
    team_id: DataTypes.INTEGER,
    room_id: DataTypes.INTEGER,
    mission_id: DataTypes.INTEGER,
    team_record_id: DataTypes.INTEGER,
    start_at: DataTypes.DATE,
    end_at: DataTypes.DATE,
    time: DataTypes.INTEGER,
    score: DataTypes.INTEGER
  }, {
    timestamps: false
  });
  record.associate = function(models) {
    // associations can be defined here
  };
  return record;
};