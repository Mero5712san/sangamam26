const { Op } = require('sequelize');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const slugifyCollege = (value) => normalizeText(value)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getCollegeNameFromSlug = async (slug) => {
    const normalizedSlug = normalizeText(slug);
    const colleges = await User.findAll({
        attributes: ['college'],
        where: {
            college: { [Op.ne]: null }
        },
        group: ['college'],
        raw: true
    });

    const match = colleges.find((row) => slugifyCollege(row.college) === normalizedSlug);
    return match?.college || null;
};

exports.updateStatus = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { status } = req.body;
        if (!['active', 'freezed', 'disqualified'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.status = status;
        await user.save();

        res.json({ message: 'Status updated', status: user.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCollegeDetails = async (req, res) => {
    try {
        const collegeName = await getCollegeNameFromSlug(req.params.slug);
        if (!collegeName) {
            return res.status(404).json({ message: 'College not found' });
        }

        const students = await User.findAll({
            where: { college: collegeName },
            attributes: ['id', 'name', 'gender'],
            raw: true
        });

        const registrations = await Registration.findAll({
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'gender', 'college'] },
                { model: Event, as: 'event', attributes: ['id', 'name'] }
            ]
        });

        const collegeRegistrations = registrations.filter((registration) => normalizeText(registration.user?.college) === normalizeText(collegeName));

        const uniqueStudentMap = new Map();
        for (const student of students) {
            uniqueStudentMap.set(student.id, student);
        }

        const totals = {
            total: uniqueStudentMap.size,
            boys: 0,
            girls: 0,
            internal: uniqueStudentMap.size
        };

        for (const student of uniqueStudentMap.values()) {
            const gender = normalizeText(student.gender);
            if (gender === 'male') totals.boys += 1;
            else if (gender === 'female') totals.girls += 1;
        }

        const eventMap = new Map();
        for (const registration of collegeRegistrations) {
            const event = registration.event;
            if (!event) continue;

            const existing = eventMap.get(event.id) || {
                id: event.id,
                name: event.name,
                boys: 0,
                girls: 0,
                total: 0
            };

            existing.total += 1;
            const gender = normalizeText(registration.user?.gender);
            if (gender === 'male') existing.boys += 1;
            else if (gender === 'female') existing.girls += 1;

            eventMap.set(event.id, existing);
        }

        const eventWise = Array.from(eventMap.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

        res.json({
            college: {
                name: collegeName,
                slug: slugifyCollege(collegeName)
            },
            stats: totals,
            eventWise
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
