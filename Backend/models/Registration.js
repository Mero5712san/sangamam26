const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Event = require('./Event');

const Registration = sequelize.define('Registration', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('individual', 'team'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('registered', 'participating', 'completed', 'absent'),
        defaultValue: 'registered'
    },
    teamDetails: {
        type: DataTypes.JSON,
        defaultValue: null
    },
    qrCode: {
        type: DataTypes.TEXT('long')
    }
});

// Relationships
Registration.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Registration.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
User.hasMany(Registration, { foreignKey: 'userId' });
Event.hasMany(Registration, { foreignKey: 'eventId' });

// Self-referencing relationship for volunteers/assigned events could be complex, 
// let's use a junction table if needed, but for now we'll store it as JSON in User or a separate table.
// For volunteer assignments:
const VolunteerAssignment = sequelize.define('VolunteerAssignment', {});
User.belongsToMany(Event, { through: VolunteerAssignment, as: 'assignedEvents' });
Event.belongsToMany(User, { through: VolunteerAssignment, as: 'volunteers' });

module.exports = Registration;
