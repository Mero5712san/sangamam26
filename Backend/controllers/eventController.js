const Event = require('../models/Event');
const User = require('../models/User');

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const normalizeAssignedEventIds = (assignedEventIds) => {
    const values = Array.isArray(assignedEventIds)
        ? assignedEventIds
        : typeof assignedEventIds === 'string'
            ? (() => {
                try {
                    const parsed = JSON.parse(assignedEventIds);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (error) {
                    return [];
                }
            })()
            : typeof assignedEventIds === 'number'
                ? [assignedEventIds]
                : [];

    return values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
};

const getCoordinatorTokens = (event) => {
    const coordinators = [
        ...(Array.isArray(event?.coordinators) ? event.coordinators : []),
        ...(Array.isArray(event?.incharges) ? event.incharges : []),
        ...(event?.incharge ? [event.incharge] : [])
    ].filter(Boolean);

    const tokens = new Set();

    for (const coordinator of coordinators) {
        if (typeof coordinator === 'string') {
            tokens.add(normalizeText(coordinator));
            continue;
        }

        if (coordinator && typeof coordinator === 'object') {
            tokens.add(normalizeText(coordinator.email));
            tokens.add(normalizeText(coordinator.name));
        }
    }

    return tokens;
};

const canManageEvent = (event, user) => {
    if (!event || !user) return false;
    if (user.role === 'admin') return true;
    if (user.role !== 'incharge') return false;

    const assignedEventIds = normalizeAssignedEventIds(user.assignedEventIds);
    if (assignedEventIds.includes(Number(event.id))) {
        return true;
    }

    const tokens = getCoordinatorTokens(event);
    return [user.email, user.name, user.uuid]
        .map(normalizeText)
        .some((token) => token && tokens.has(token));
};

const syncUserEventAssignments = async (event, previousCoordinatorEmails = []) => {
    const currentCoordinatorEmails = Array.from(getCoordinatorTokens(event))
        .filter((email) => email.includes('@'));
    const affectedEmails = Array.from(new Set([...previousCoordinatorEmails, ...currentCoordinatorEmails]));

    if (affectedEmails.length === 0) {
        return;
    }

    const users = await User.findAll({
        where: { email: affectedEmails },
        attributes: ['id', 'email', 'assignedEventIds']
    });

    for (const user of users) {
        const assignedEventIds = new Set(normalizeAssignedEventIds(user.assignedEventIds));
        const email = normalizeText(user.email);
        const shouldBeAssigned = currentCoordinatorEmails.includes(email);

        if (shouldBeAssigned) {
            assignedEventIds.add(event.id);
        } else {
            assignedEventIds.delete(event.id);
        }

        await user.update({ assignedEventIds: Array.from(assignedEventIds).sort((a, b) => a - b) });
    }
};

const normalizeEventPayload = (payload) => {
    const normalized = { ...payload };

    if (Array.isArray(normalized.incharges) && !Array.isArray(normalized.coordinators)) {
        normalized.coordinators = normalized.incharges;
    }

    if (normalized.participationType && !normalized.registrationType) {
        normalized.registrationType = normalized.participationType;
    }

    if (typeof normalized.icon === 'string' && normalized.icon.startsWith('/') && !normalized.image) {
        normalized.image = normalized.icon;
    }

    delete normalized.incharges;
    delete normalized.participationType;

    return normalized;
};

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.findAll();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAssignedEvents = async (req, res) => {
    try {
        const assignedEventIds = normalizeAssignedEventIds(req.user?.assignedEventIds);

        if (req.user?.role === 'admin') {
            const events = await Event.findAll();
            return res.json(events);
        }

        if (assignedEventIds.length === 0) {
            return res.json([]);
        }

        const events = await Event.findAll({
            where: { id: assignedEventIds }
        });

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEventBySlug = async (req, res) => {
    try {
        const event = await Event.findOne({ where: { slug: req.params.slug } });
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const event = await Event.create(normalizeEventPayload(req.body));
        await syncUserEventAssignments(event);
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findOne({ where: { slug: req.params.slug } });
        if (event) {
            if (!canManageEvent(event, req.user)) {
                return res.status(403).json({ message: 'You are not assigned to manage this event' });
            }
            const previousCoordinatorEmails = Array.from(getCoordinatorTokens(event)).filter((value) => value.includes('@'));
            await event.update(normalizeEventPayload(req.body));
            await syncUserEventAssignments(event, previousCoordinatorEmails);
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateReport = async (req, res) => {
    try {
        // Accept either a JSON body with `geo`/`prizes` or a multipart upload with `geoImage` file
        const event = await Event.findOne({ where: { slug: req.params.slug } });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (!canManageEvent(event, req.user)) {
            return res.status(403).json({ message: 'You are not assigned to manage this event' });
        }

        const updatedReports = { ...event.reports };

        // If a file was uploaded via multer, prefer that as the geo image path
        if (req.file) {
            // store relative path for frontend consumption
            updatedReports.geo = `/uploads/${req.file.filename}`;
        } else {
            const { geo, prizes } = req.body;
            if (geo) {
                // ensure geo is a single string (image URL/path) or clear it
                updatedReports.geo = typeof geo === 'string' ? geo : '';
            }
            if (prizes) {
                try {
                    updatedReports.prizes = typeof prizes === 'string' ? JSON.parse(prizes) : prizes;
                } catch (e) {
                    updatedReports.prizes = prizes;
                }
            }
        }

        event.reports = updatedReports;
        await event.save();
        res.json({ message: 'Report updated', reports: event.reports });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
