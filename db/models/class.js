'use strict';
module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('Class', {
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
  Class.associate = function(models) {
    // associations can be defined here
  };
  return Class;
};