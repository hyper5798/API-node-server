'use strict';
module.exports = (sequelize, DataTypes) => {
  const network = sequelize.define('network', {
    network_name: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, { 
    timestamps: false
  });
  network.associate = function(models) {
    // associations can be defined here
  };
  return network;
};