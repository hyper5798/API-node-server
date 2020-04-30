'use strict';
module.exports = (sequelize, DataTypes) => {
  const Network = sequelize.define('Network', {
    network_name: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  Network.associate = function(models) {
    // associations can be defined here
  };
  return Network;
};