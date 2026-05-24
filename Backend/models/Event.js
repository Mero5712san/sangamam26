const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: '📅'
    },
    image: { type: DataTypes.STRING },
    tagline: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    date: { type: DataTypes.STRING },
    time: { type: DataTypes.STRING },
    venue: { type: DataTypes.STRING },
    registrationType: {
        type: DataTypes.ENUM('solo', 'team', 'both'),
        defaultValue: 'solo'
    },
    minTeamSize: { type: DataTypes.INTEGER, defaultValue: 1 },
    maxTeamSize: { type: DataTypes.INTEGER, defaultValue: 1 },
    maxSoloRegistrations: { type: DataTypes.INTEGER, defaultValue: 100 },
    maxTeamRegistrations: { type: DataTypes.INTEGER, defaultValue: 20 },
    instructions: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    coordinators: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    isFrozen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    reports: {
        type: DataTypes.JSON,
        defaultValue: {
            geo: '',
            prizes: {
                internal: { first: '', second: '' },
                external: { first: '', second: '' }
            }
        }
    }
});

module.exports = Event;
