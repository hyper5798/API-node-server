'use strict';
module.exports = (sequelize, DataTypes) => {
  const team_record = sequelize.define('team_record', {
    team_id: DataTypes.INTEGER,
    room_id: DataTypes.INTEGER,
    cp_id: DataTypes.INTEGER,
    total_time: DataTypes.INTEGER,
    reduce: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    sequence: DataTypes.INTEGER,
    start: DataTypes.DATE,
    end: DataTypes.DATE
  }, {
    timestamps: false
  });
  team_record.associate = function(models) {
    // associations can be defined here
  };
  return team_record;
};