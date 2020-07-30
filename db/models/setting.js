'use strict';
module.exports = (sequelize, DataTypes) => {
  const setting = sequelize.define('setting', {
    type_id: DataTypes.INTEGER,
    app_id: DataTypes.INTEGER,
    field: DataTypes.STRING,
    set: DataTypes.TEXT,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  setting.associate = function(models) {
    // associations can be defined here
  };
  return setting;
};