'use strict';
module.exports = (sequelize, DataTypes) => {
  const report = sequelize.define('report', {
    macAddr: DataTypes.STRING,
    type_id: DataTypes.INTEGER,
    data: DataTypes.TEXT,
    extra: DataTypes.TEXT,
    recv: DataTypes.DATE
  }, { 
    timestamps: false
  });
  report.associate = function(models) {
    // associations can be defined here
  };
  return report;
};