const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OtpVerification = sequelize.define('OtpVerification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    otpExpires: {
        type: DataTypes.DATE,
        allowNull: false
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = OtpVerification;
