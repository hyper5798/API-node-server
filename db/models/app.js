'use strict';
module.exports = (sequelize, DataTypes) => {
  const app = sequelize.define('app', {
    name: DataTypes.STRING,
    macAddr: DataTypes.STRING,
    api_key: DataTypes.STRING,
    key_label: DataTypes.TEXT,
    key_parse: DataTypes.TEXT,
    description: DataTypes.STRING,
    image_url: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  app.associate = function(models) {
    // associations can be defined here
  };
  return app;
};