const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TeamInvitation = sequelize.define('TeamInvitation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    leaderRegistrationId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    inviterId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    inviterName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    inviterEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    inviteeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    inviteeName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    inviteeEmail: {
        type: DataTypes.STRING,
        allowNull: false
    },
    teamName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    eventName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled'),
        defaultValue: 'pending'
    },
    respondedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = TeamInvitation;