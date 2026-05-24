const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const sequelize = require('./config/db');
require('./models/User');
require('./models/Event');
require('./models/OtpVerification');
require('./models/Registration');
const Event = require('./models/Event');
const User = require('./models/User');

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const normalizeAssignedEventIds = (assignedEventIds) => {
    if (Array.isArray(assignedEventIds)) {
        return assignedEventIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0);
    }

    if (typeof assignedEventIds === 'string') {
        try {
            const parsed = JSON.parse(assignedEventIds);
            return Array.isArray(parsed)
                ? parsed.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
                : [];
        } catch (error) {
            return [];
        }
    }

    if (typeof assignedEventIds === 'number') {
        return [Number(assignedEventIds)];
    }

    return [];
};

const getCoordinatorEmails = (event) => {
    const coordinators = [
        ...(Array.isArray(event?.coordinators) ? event.coordinators : []),
        ...(Array.isArray(event?.incharges) ? event.incharges : []),
        ...(event?.incharge ? [event.incharge] : [])
    ].filter(Boolean);

    return coordinators
        .map((coordinator) => {
            if (typeof coordinator === 'string') {
                return normalizeText(coordinator);
            }

            if (coordinator && typeof coordinator === 'object') {
                return normalizeText(coordinator.email);
            }

            return '';
        })
        .filter(Boolean);
};

const syncExistingEventAssignments = async () => {
    const events = await Event.findAll({ attributes: ['id', 'coordinators'] });
    const users = await User.findAll({ attributes: ['id', 'email', 'assignedEventIds'] });
    const userByEmail = new Map(users.map((user) => [normalizeText(user.email), user]));

    for (const event of events) {
        const coordinatorEmails = getCoordinatorEmails(event);

        for (const email of coordinatorEmails) {
            const user = userByEmail.get(email);
            if (!user) continue;

            const assignedEventIds = new Set(normalizeAssignedEventIds(user.assignedEventIds));
            assignedEventIds.add(event.id);
            await user.update({ assignedEventIds: Array.from(assignedEventIds).sort((a, b) => a - b) });
        }
    }
};

// DB Connection
// Use non-destructive sync to avoid dropping tables/data on restart
sequelize.sync({ alter: true }).then(() => {
    return syncExistingEventAssignments();
}).then(() => {
    console.log('MySQL Database synced and event assignments refreshed...');
}).catch(err => {
    console.log('Database sync error:', err);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => {
    res.send('Sangamam API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
