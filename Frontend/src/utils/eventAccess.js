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

export const canManageEvent = (user, event) => {
    if (!user || !event) return false;
    if (user.role === 'admin') return true;
    if (user.role !== 'incharge') return false;

    if (normalizeAssignedEventIds(user.assignedEventIds).includes(Number(event.id))) {
        return true;
    }

    const tokens = getCoordinatorTokens(event);
    return [user.email, user.name, user.uuid]
        .map(normalizeText)
        .some((token) => token && tokens.has(token));
};