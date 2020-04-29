'use strict';
module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define('Device', {
    device_name: DataTypes.STRING,
    mac: DataTypes.STRING,
    status: DataTypes.INTEGER,
    cp_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    type_id: DataTypes.INTEGER,
    network_id: DataTypes.INTEGER,
    description: DataTypes.STRING,
    image_url: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  Device.associate = function(models) {
    // associations can be defined here
  };
  return Device;
};