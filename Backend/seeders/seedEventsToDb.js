const sequelize = require('../config/db');
const Event = require('../models/Event');
const { events } = require('./eventseeder');

const REGISTRATION_CONFIG = {
    5: { registrationType: 'team', minTeamSize: 2, maxTeamSize: 2 },
    6: { registrationType: 'team', minTeamSize: 5, maxTeamSize: 8 },
    7: { registrationType: 'team', minTeamSize: 6, maxTeamSize: 8 },
    9: { registrationType: 'team', minTeamSize: 8, maxTeamSize: 12 },
    10: { registrationType: 'both', minTeamSize: 5, maxTeamSize: 8 },
    11: { registrationType: 'both', minTeamSize: 6, maxTeamSize: 8 },
    13: { registrationType: 'team', minTeamSize: 2, maxTeamSize: 2 }
};

const IMAGE_MAP = {
    1: '/speech.jpeg',
    2: '/kavidhai.jpeg',
    3: '/drawing.jpeg',
    4: '/meme.jpeg',
    5: '/theeilasamaiyal.jpeg',
    6: '/villupattu.jpeg',
    7: '/mime.jpeg',
    8: '/thanithiran.jpeg',
    9: '/therukoothu.jpeg',
    10: '/dance.jpeg',
    11: '/naatupura.jpeg',
    12: '/silambam.jpeg',
    13: '/sentamil.jpeg'
};

function toEventPayload(rawEvent) {
    const reg = REGISTRATION_CONFIG[rawEvent.id] || {
        registrationType: 'solo',
        minTeamSize: 1,
        maxTeamSize: 1
    };

    const coordinatorLines = (rawEvent.coordinators || []).map((c) => `${c.name} (${c.phone})`);
    const topicLines = (rawEvent.topics || []).map((topic) => `தலைப்பு: ${topic}`);

    const descriptionParts = [
        `வகை: ${rawEvent.category}`,
        coordinatorLines.length ? `ஒருங்கிணைப்பாளர்கள்: ${coordinatorLines.join(', ')}` : '',
        topicLines.length ? `போட்டி தலைப்புகள்: ${rawEvent.topics.join(', ')}` : ''
    ].filter(Boolean);

    const instructions = [
        ...topicLines,
        ...(rawEvent.rules || [])
    ];

    const imagePath = IMAGE_MAP[rawEvent.id] || null;

    return {
        id: rawEvent.id,
        name: rawEvent.title,
        slug: `event-${rawEvent.id}`,
        image: imagePath,
        icon: imagePath,
        tagline: rawEvent.tagline,
        description: descriptionParts.join(' | '),
        audienceType: rawEvent.audienceType || 'external',
        registrationType: reg.registrationType,
        minTeamSize: reg.minTeamSize,
        maxTeamSize: reg.maxTeamSize,
        instructions,
        coordinators: rawEvent.coordinators || [],
        maxSoloRegistrations: 200,
        maxTeamRegistrations: 50,
        isFrozen: false
    };
}

async function seedEvents() {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        const payloads = events.map(toEventPayload);

        for (const payload of payloads) {
            await Event.upsert(payload);
        }

        console.log(`Seeded ${payloads.length} events into Events table.`);
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed events:', error);
        process.exit(1);
    }
}

seedEvents();
