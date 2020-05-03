'use strict';
module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    macAddr: DataTypes.STRING,
    type_id: DataTypes.INTEGER,
    data: DataTypes.TEXT,
    extra: DataTypes.TEXT,
    recv: DataTypes.DATE
  }, {
    timestamps: false
  });
  Report.associate = function(models) {
    // associations can be defined here
  };
  return Report;
};