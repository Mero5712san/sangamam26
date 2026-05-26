const fs = require('fs');
const path = require('path');
const Event = require('../models/Event');
const User = require('../models/User');

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const isInternalUser = (user) => {
    const college = normalizeText(user?.college);
    return /\bbannari amman institute of technology\b|\bbit sathy\b|\bbit\b/.test(college);
};

const isEventVisibleToUser = (event, user) => {
    if (!event) return false;
    // Admins and incharges should see all events in the listing
    if (user?.role === 'admin' || user?.role === 'incharge') return true;

    const audienceType = normalizeText(event.audienceType || 'external');
    const internalUser = isInternalUser(user);

    if (audienceType === 'both') return true;
    if (audienceType === 'internal') return internalUser;
    if (audienceType === 'external') return !internalUser;

    return true;
};

const applyAudienceScheduleForUser = (event, user) => {
    // Return a shallow plain object copy with time/date overridden
    const e = { ...event.get ? event.get() : event };
    const internalUser = isInternalUser(user);

    if (internalUser) {
        if (e.internalTime || e.internalEndTime || e.internalDate) {
            e.time = e.internalTime || e.time;
            e.endTime = e.internalEndTime || e.endTime;
            e.date = e.internalDate || e.date;
        }
    } else {
        if (e.externalTime || e.externalEndTime || e.externalDate) {
            e.time = e.externalTime || e.time;
            e.endTime = e.externalEndTime || e.endTime;
            e.date = e.externalDate || e.date;
        }
    }

    return e;
};

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

    if (normalized.visibilityType && !normalized.audienceType) {
        normalized.audienceType = normalized.visibilityType;
    }

    if (normalized.audience && !normalized.audienceType) {
        normalized.audienceType = normalized.audience;
    }

    if (typeof normalized.icon === 'string' && normalized.icon.startsWith('/') && !normalized.image) {
        normalized.image = normalized.icon;
    }

    delete normalized.incharges;
    delete normalized.participationType;
    delete normalized.visibilityType;
    delete normalized.audience;

    return normalized;
};

const allowedDocumentTypes = new Set(['rulebook', 'schedule']);

const serializeUploadedDocument = (file) => ({
    url: `/uploads/${file.filename}`,
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.size
});

const getStoredDocumentPath = (documentValue) => {
    const documentUrl = typeof documentValue === 'string' ? documentValue : documentValue?.url;
    if (!documentUrl || !documentUrl.startsWith('/uploads/')) return null;
    return path.join(__dirname, '..', documentUrl);
};

const deleteStoredDocumentFile = async (documentValue) => {
    const filePath = getStoredDocumentPath(documentValue);
    if (!filePath) return;

    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.findAll();
        const visible = events.filter((event) => isEventVisibleToUser(event, req.user));
        const adjusted = visible.map((event) => applyAudienceScheduleForUser(event, req.user));
        res.json(adjusted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAssignedEvents = async (req, res) => {
    try {
        const assignedEventIds = normalizeAssignedEventIds(req.user?.assignedEventIds);

        if (req.user?.role === 'admin') {
            const events = await Event.findAll();
            return res.json(events.map((e) => applyAudienceScheduleForUser(e, req.user)));
        }

        if (assignedEventIds.length === 0) {
            return res.json([]);
        }

        const events = await Event.findAll({ where: { id: assignedEventIds } });
        res.json(events.map((e) => applyAudienceScheduleForUser(e, req.user)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEventBySlug = async (req, res) => {
    try {
        const event = await Event.findOne({ where: { slug: req.params.slug } });
        if (event && isEventVisibleToUser(event, req.user)) {
            res.json(applyAudienceScheduleForUser(event, req.user));
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

exports.updateEventDocument = async (req, res) => {
    try {
        const { type } = req.params;
        if (!allowedDocumentTypes.has(type)) {
            return res.status(400).json({ message: 'Invalid document type' });
        }

        const event = await Event.findOne({ where: { slug: req.params.slug } });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const documents = { ...(event.documents || {}) };
        await deleteStoredDocumentFile(documents[type]);
        documents[type] = serializeUploadedDocument(req.file);

        event.documents = documents;
        await event.save();

        res.json({ message: `${type} document uploaded`, documents: event.documents });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteEventDocument = async (req, res) => {
    try {
        const { type } = req.params;
        if (!allowedDocumentTypes.has(type)) {
            return res.status(400).json({ message: 'Invalid document type' });
        }

        const event = await Event.findOne({ where: { slug: req.params.slug } });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const documents = { ...(event.documents || {}) };
        await deleteStoredDocumentFile(documents[type]);
        documents[type] = null;

        event.documents = documents;
        await event.save();

        res.json({ message: `${type} document deleted`, documents: event.documents });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
