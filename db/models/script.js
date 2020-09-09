'use strict';
module.exports = (sequelize, DataTypes) => {
  const script = sequelize.define('script', {
    script_name: DataTypes.STRING,
    mission_id: DataTypes.INTEGER,
    room_id: DataTypes.INTEGER,
    content: DataTypes.STRING,
    prompt: DataTypes.STRING,
    pass: DataTypes.TEXT,
    note: DataTypes.STRING,
    image_url: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  }, {
    timestamps: false
  });
  script.associate = function(models) {
    // associations can be defined here
  };
  return script;
};
