'use strict';
module.exports = (sequelize, DataTypes) => {
  const Type = sequelize.define('Type', {
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
  Type.associate = function(models) {
    // associations can be defined here
  };
  return Type;
};