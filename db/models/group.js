'use strict';
module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    group_name: DataTypes.STRING,
    cp_id: DataTypes.INTEGER,
    group_option: DataTypes.INTEGER,
    members: DataTypes.TEXT,
    devices: DataTypes.TEXT,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  Group.associate = function(models) {
    // associations can be defined here
  };
  return Group;
};