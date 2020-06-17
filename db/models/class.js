'use strict';
module.exports = (sequelize, DataTypes) => {
  const classes = sequelize.define('class', {
    class_name: DataTypes.STRING,
    cp_id: DataTypes.INTEGER,
    class_option: DataTypes.INTEGER,
    members: DataTypes.TEXT,
    devices: DataTypes.TEXT,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, { 
    timestamps: false
  });
  classes.associate = function(models) {
    // associations can be defined here
  };
  return classes;
};