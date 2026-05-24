const User = require('../models/User');
const Event = require('../models/Event');

exports.addVolunteer = async (req, res) => {
    try {
        const { name, email, password, phone, rollNo, department, year, gender, college } = req.body;
        
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const volunteer = await User.create({
            name, email, password, role: 'volunteer', phone, rollNo, department, year, gender, college,
            isVerified: true
        });

        res.status(201).json(volunteer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.assignEvent = async (req, res) => {
    try {
        const { eventIds } = req.body; 
        const volunteer = await User.findByPk(req.params.id);
        
        if (volunteer && volunteer.role === 'volunteer') {
            await volunteer.setAssignedEvents(eventIds);
            const updated = await User.findByPk(volunteer.id, { include: [{ model: Event, as: 'assignedEvents' }] });
            res.json(updated);
        } else {
            res.status(404).json({ message: 'Volunteer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getVolunteers = async (req, res) => {
    try {
        const volunteers = await User.findAll({ 
            where: { role: 'volunteer' },
            include: [{ model: Event, as: 'assignedEvents' }]
        });
        res.json(volunteers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
