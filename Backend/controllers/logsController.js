const { Op } = require('sequelize');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const normalizeText = (value) => String(value || '').trim();

const toIso = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
};

const buildRegistrationLog = (registration) => ({
    id: `reg-${registration.id}`,
    user: registration.user?.name || 'Unknown user',
    action: registration.status === 'participating' ? 'Attendance marked present' : registration.status === 'absent' ? 'Attendance marked absent' : 'Registered for event',
    target: registration.event?.name || 'Unknown event',
    timestamp: registration.updatedAt || registration.createdAt,
    status: registration.status === 'participating' ? 'success' : registration.status === 'absent' ? 'warning' : 'info'
});

const buildEventLog = (event) => ({
    id: `event-${event.id}`,
    user: 'Admin / Incharge',
    action: 'Event updated',
    target: event.name,
    timestamp: event.updatedAt || event.createdAt,
    status: 'info'
});

const buildUserLog = (user) => ({
    id: `user-${user.id}`,
    user: user.name || 'Unknown user',
    action: user.status === 'disqualified' ? 'Account disqualified' : user.status === 'freezed' ? 'Account frozen' : 'Account updated',
    target: user.college || 'User profile',
    timestamp: user.updatedAt || user.createdAt,
    status: user.status === 'active' ? 'success' : 'warning'
});

exports.getRecentLogs = async (req, res) => {
    try {
        const [registrations, events, users] = await Promise.all([
            Registration.findAll({
                include: [
                    { model: User, as: 'user', attributes: ['name'] },
                    { model: Event, as: 'event', attributes: ['name'] }
                ],
                order: [['updatedAt', 'DESC']],
                limit: 10
            }),
            Event.findAll({
                attributes: ['id', 'name', 'updatedAt', 'createdAt'],
                order: [['updatedAt', 'DESC']],
                limit: 10
            }),
            User.findAll({
                attributes: ['id', 'name', 'college', 'status', 'updatedAt', 'createdAt'],
                where: { updatedAt: { [Op.ne]: null } },
                order: [['updatedAt', 'DESC']],
                limit: 10
            })
        ]);

        const logs = [
            ...registrations.map(buildRegistrationLog),
            ...events.map(buildEventLog),
            ...users.map(buildUserLog)
        ]
            .filter((entry) => entry.timestamp)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 30)
            .map((entry) => ({
                ...entry,
                timestamp: toIso(entry.timestamp)
            }));

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};