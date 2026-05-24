const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const QRCode = require('qrcode');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isStaffRole = (role) => ['admin', 'incharge', 'volunteer'].includes(role);

const collectTakenEmailsForEvent = async (eventId) => {
    const regs = await Registration.findAll({
        where: { eventId },
        include: [{ model: User, as: 'user', attributes: ['email'] }]
    });

    const taken = new Set();

    for (const reg of regs) {
        if (reg.user?.email) {
            taken.add(normalizeEmail(reg.user.email));
        }

        if (reg.teamDetails?.leader) {
            taken.add(normalizeEmail(reg.teamDetails.leader));
        }

        if (Array.isArray(reg.teamDetails?.members)) {
            for (const member of reg.teamDetails.members) {
                if (member?.email) {
                    taken.add(normalizeEmail(member.email));
                }
            }
        }
    }

    return taken;
};

exports.registerEvent = async (req, res) => {
    try {
        const { eventId, type, teamDetails } = req.body;
        const userId = req.user.id;

        if (isStaffRole(req.user.role)) {
            return res.status(403).json({ message: 'Staff accounts cannot register for events' });
        }

        const existing = await Registration.findOne({ where: { userId, eventId } });
        if (existing) return res.status(400).json({ message: 'Already registered' });

        const event = await Event.findByPk(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (type === 'team') {
            const members = Array.isArray(teamDetails?.members) ? teamDetails.members : [];
            const memberEmails = members.map((m) => normalizeEmail(m?.email)).filter(Boolean);

            if (memberEmails.length === 0) {
                return res.status(400).json({ message: 'Select at least one team member' });
            }

            if (new Set(memberEmails).size !== memberEmails.length) {
                return res.status(400).json({ message: 'Duplicate members are not allowed in a team' });
            }

            const minMembersToSelect = Math.max((event.minTeamSize || 2) - 1, 1);
            const maxMembersToSelect = Math.max((event.maxTeamSize || 4) - 1, minMembersToSelect);

            if (memberEmails.length < minMembersToSelect || memberEmails.length > maxMembersToSelect) {
                return res.status(400).json({ message: `Team must include ${minMembersToSelect} to ${maxMembersToSelect} members besides leader` });
            }

            if (!req.user.college) {
                return res.status(400).json({ message: 'Your college information is required for team events' });
            }

            const memberUsers = await User.findAll({
                where: { email: memberEmails },
                attributes: ['id', 'name', 'email', 'college', 'role']
            });

            if (memberUsers.length !== memberEmails.length) {
                return res.status(400).json({ message: 'Some selected members are not registered in the portal' });
            }

            const invalidByRole = memberUsers.find((u) => u.role !== 'participant');
            if (invalidByRole) {
                return res.status(400).json({ message: 'Only participant accounts can be added to team' });
            }

            const invalidByCollege = memberUsers.find((u) => normalizeEmail(u.college) !== normalizeEmail(req.user.college));
            if (invalidByCollege) {
                return res.status(400).json({ message: 'All team members must belong to your college' });
            }

            const takenEmails = await collectTakenEmailsForEvent(eventId);
            const alreadyTaken = memberEmails.find((email) => takenEmails.has(email));
            if (alreadyTaken) {
                return res.status(400).json({ message: `${alreadyTaken} is already participating in this event` });
            }
        }

        const qrData = JSON.stringify({
            id: req.user.uuid,
            name: req.user.name,
            eventId: eventId,
            uuid: Math.random().toString(36).substring(2, 15)
        });
        const qrCode = await QRCode.toDataURL(qrData);

        const registration = await Registration.create({
            userId,
            eventId,
            type,
            teamDetails,
            qrCode
        });

        // Fetch back with populated event
        const result = await Registration.findByPk(registration.id, { include: [{ model: Event, as: 'event' }] });
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEligibleTeamMembers = async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        if (!eventId) return res.status(400).json({ message: 'Invalid event id' });

        const event = await Event.findByPk(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (!req.user.college) {
            return res.json([]);
        }

        const takenEmails = await collectTakenEmailsForEvent(eventId);
        const users = await User.findAll({
            where: {
                role: 'participant',
                college: req.user.college
            },
            attributes: ['name', 'email'],
            order: [['name', 'ASC']]
        });

        const selfEmail = normalizeEmail(req.user.email);
        const options = users
            .filter((u) => normalizeEmail(u.email) !== selfEmail)
            .filter((u) => !takenEmails.has(normalizeEmail(u.email)))
            .map((u) => ({
                value: u.email,
                label: `${u.name} (${u.email})`
            }));

        res.json(options);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.findAll({
            where: { userId: req.user.id },
            include: [{ model: Event, as: 'event', required: true }, { model: User, as: 'user' }]
        });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAttendance = async (req, res) => {
    try {
        const { status } = req.body;
        const registration = await Registration.findByPk(req.params.id);

        if (registration) {
            registration.status = status;
            await registration.save();
            res.json({ message: 'Attendance marked', status: registration.status });
        } else {
            res.status(404).json({ message: 'Registration not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEventRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.findAll({
            where: { eventId: req.params.eventId },
            include: [{ model: User, as: 'user' }]
        });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAssignedRegistrations = async (req, res) => {
    try {
        const assignedEventIds = (() => {
            const val = req.user?.assignedEventIds;
            if (Array.isArray(val)) return val.map((v) => Number(v)).filter(Number.isInteger);
            if (typeof val === 'number') return [Number(val)];
            if (typeof val === 'string') {
                try { const p = JSON.parse(val); return Array.isArray(p) ? p.map((v) => Number(v)).filter(Number.isInteger) : []; } catch (e) { return []; }
            }
            return [];
        })();

        if (assignedEventIds.length === 0) return res.json([]);

        const registrations = await Registration.findAll({
            where: { eventId: assignedEventIds },
            include: [{ model: User, as: 'user' }, { model: Event, as: 'event' }]
        });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserRegistrations = async (req, res) => {
    try {
        const user = await User.findOne({ where: { uuid: req.params.uuid } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const registrations = await Registration.findAll({
            where: { userId: user.id },
            include: [{ model: Event, as: 'event' }, { model: User, as: 'user' }]
        });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
