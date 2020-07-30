'use strict';
module.exports = (sequelize, DataTypes) => {
  const product = sequelize.define('product', {
    type_id: DataTypes.INTEGER,
    macAddr: DataTypes.STRING,
    description: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  product.associate = function(models) {
    // associations can be defined here
  };
  return product;
};