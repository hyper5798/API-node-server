'use strict';
module.exports = (sequelize, DataTypes) => {
  const room = sequelize.define('room', {
    room_name: DataTypes.STRING,
    pass_time: DataTypes.INTEGER,
    cp_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  room.associate = function(models) {
    // associations can be defined here
  };
  return room;
};