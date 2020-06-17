'use strict';
module.exports = (sequelize, DataTypes) => {
  const type = sequelize.define('type', {
    type_id: DataTypes.INTEGER,
    type_name: DataTypes.STRING,
    description: DataTypes.STRING,
    image_url: DataTypes.STRING,
    rules: DataTypes.TEXT,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, { 
    timestamps: false
  });
  type.associate = function(models) {
    // associations can be defined here
  };
  return type;
};