'use strict';
module.exports = (sequelize, DataTypes) => {
  const report = sequelize.define('report', {
    macAddr: DataTypes.STRING,
    type_id: DataTypes.INTEGER,
    key1: DataTypes.INTEGER,
    key2: DataTypes.INTEGER,
    key3: DataTypes.INTEGER,
    key4: DataTypes.INTEGER,
    key5: DataTypes.INTEGER,
    key6: DataTypes.INTEGER,
    key7: DataTypes.INTEGER,
    key8: DataTypes.INTEGER,
    data: DataTypes.TEXT,
    extra: DataTypes.TEXT,
    app_id:DataTypes.INTEGER,
    recv: DataTypes.DATE
  }, { 
    timestamps: false
  });
  report.associate = function(models) {
    // associations can be defined here
  };
  return report;
};