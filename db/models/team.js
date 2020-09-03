'use strict';
module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define('team', {
    name: DataTypes.STRING,
    cp_id: DataTypes.INTEGER,
    members: DataTypes.TEXT,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  Team.associate = function(models) {
    // associations can be defined here
  };
  return Team;
};