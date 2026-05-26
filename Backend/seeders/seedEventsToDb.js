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
    13: '/sentamil.jpeg',
    14: '/vinaadivina.jpeg',
    15: '/vivadhamedai.jpeg',
    16: '/koovivirkalaamvaanga.jpeg',
    17: '/kurumpadam.jpeg'
};

const EVENT_TIME_MAP = {
    // External event timings (from user-provided externalEventTimings)
    'நிகழ்வுத் தொடக்க விழா': { startTime: '09:00', endTime: '09:45' },
    'பேச்சு - சிந்தனை பேசட்டும் ROUND 01': { startTime: '10:00', endTime: '10:45' },
    'சிலம்பம் - சிலம்பொலி ஆட்டம்': { startTime: '10:00', endTime: '10:45' },
    'சிலம்பொலி ஆட்டம்': { startTime: '10:00', endTime: '10:45' },
    'செந்தமிழ் செல்வன் / செல்வி - செந்தமிழ் சிந்தனை சங்கமம்': { startTime: '10:00', endTime: '10:45' },
    'செந்தமிழ் சிந்தனை சங்கமம்': { startTime: '10:00', endTime: '10:45' },
    'தனிதிறன் வெளிப்பாடு - ஆற்றல் அரங்கம்': { startTime: '10:00', endTime: '10:45' },
    'ஆற்றல் அரங்கம்': { startTime: '10:00', endTime: '10:45' },
    'கவிதை - நீ கவிதைகளா...': { startTime: '11:00', endTime: '11:40' },
    'நீ கவிதைகளா…': { startTime: '11:00', endTime: '11:40' },
    'மென பொருள் நாடகம் - உணர்வின் நிழல்கள்': { startTime: '11:00', endTime: '11:40' },
    'உணர்வின் நிழல்கள்': { startTime: '11:00', endTime: '11:40' },
    'மீம் உருவாக்கம் - குறும்பகையின் உருவாக்கம்': { startTime: '11:00', endTime: '11:40' },
    'குறுநகையின் உருவாக்கம்': { startTime: '11:45', endTime: '12:40' },
    'ஓவியம் - வண்ண ராகம்': { startTime: '11:45', endTime: '12:40' },
    'வர்ண ராகம்': { startTime: '11:45', endTime: '12:40' },
    'தீயில்லா சமையல் - அனல் மறந்த அற்புதம்': { startTime: '11:45', endTime: '12:40' },
    'அனல் மறந்த அற்புதம்': { startTime: '13:30', endTime: '14:20' },
    'தொகுத்தல் - தெருவே அரங்கம்': { startTime: '11:45', endTime: '12:40' },
    'தெருவே அரங்கம்': { startTime: '14:20', endTime: '15:10' },
    'பேச்சு - சிந்தனை பேசட்டும் ROUND 02': { startTime: '11:45', endTime: '12:40' },
    'வில்லுப்பாட்டு - வில்லிசை திருவிழா': { startTime: '13:30', endTime: '14:20' },
    'வில்லிசை திருவிழா': { startTime: '15:25', endTime: '16:00' },
    'நாட்டுப்புற இசைத்திருவிழா': { startTime: '14:20', endTime: '15:10' },
    'நாட்டுப்புற இசை திருவிழா': { startTime: '14:20', endTime: '15:10' },
    'தனிநபர் நடனம் - நடன அரங்கம்': { startTime: '15:25', endTime: '16:00' },
    'குழு நடனம் - நடன அரங்கம்': { startTime: '15:25', endTime: '16:00' },

    // Internal / other timings
    'சிந்தனை பேசட்டும்': { startTime: '10:00', endTime: '10:45' },
    'மதி மாயாஜாலம்': { startTime: '10:00', endTime: '10:45' },
    'விவாத மேடை': { startTime: '11:00', endTime: '11:40' },
    'சிந்தனைச் சுவால்': { startTime: '11:00', endTime: '11:40' },
    'குறும்படம்': { startTime: '11:45', endTime: '12:40' },
    'குவி விதைகளாம் வாங்க': { startTime: '13:30', endTime: '14:20' },
    'நடன அரங்கேற்றம்': { startTime: '14:20', endTime: '16:00' },
    'விற்பனை கில்லாடி': { startTime: '13:30', endTime: '14:30' },
    'ஒவியம் ஒளியும்': { startTime: '11:45', endTime: '12:40' }
};

// Optional finer-grained maps for internal/external schedules when they differ
const EVENT_INTERNAL_TIME_MAP = {
    // titles mapped to internal times (override EVENT_TIME_MAP)
    'மதி மாயாஜாலம்': { startTime: '10:00', endTime: '10:45' },
    'சிந்தனைச் சுவால்': { startTime: '11:00', endTime: '11:40' }
};

const EVENT_EXTERNAL_TIME_MAP = {
    'மதி மாயாஜாலம்': { startTime: '10:15', endTime: '11:00' }
};

const EVENT_AUDIENCE_TYPE_MAP = {
    'நிகழ்வுத் தொடக்க விழா': 'both',
    'பேச்சு - சிந்தனை பேசட்டும்': 'both',
    'சிந்தனை பேசட்டும்': 'both',
    'சிலம்பம் - சிலம்பொலி ஆட்டம்': 'both',
    'சிலம்பொலி ஆட்டம்': 'both',
    'மதி மாயாஜாலம்': 'internal',
    'தனிதிறன் வெளிப்பாடு - ஆற்றல் அரங்கம்': 'both',
    'ஆற்றல் அரங்கம்': 'both',
    'கவிதை - நீ கவிதைகளா...': 'both',
    'நீ கவிதைகளா…': 'both',
    'விவாத மேடை': 'internal',
    'ஓவியம் - வண்ண ராகம்': 'both',
    'வர்ண ராகம்': 'both',
    'குறும்படம்': 'internal',
    'குவி விதைகளாம் வாங்க': 'internal',
    'தனிநபர் நடனம் - நடன அரங்கம்': 'both',
    'குழு நடனம் - நடன அரங்கம்': 'both',
    'நடன அரங்கேற்றம்': 'both',
    'செந்தமிழ் செல்வன் / செல்வி - செந்தமிழ் சிந்தனை சங்கமம்': 'external',
    'செந்தமிழ் சிந்தனை சங்கமம்': 'external',
    'மென பொருள் நாடகம் - உணர்வின் நிழல்கள்': 'external',
    'உணர்வின் நிழல்கள்': 'external',
    'மீம் உருவாக்கம் - குறும்பகையின் உருவாக்கம்': 'external',
    'குறுநகையின் உருவாக்கம்': 'external',
    'தீயில்லா சமையல் - அனல் மறந்த அற்புதம்': 'external',
    'அனல் மறந்த அற்புதம்': 'external',
    'தொகுத்தல் - தெருவே அரங்கம்': 'external',
    'தெருவே அரங்கம்': 'external',
    'வில்லுப்பாட்டு - வில்லிசை திருவிழா': 'external',
    'வில்லிசை திருவிழா': 'external',
    'நாட்டுப்புற இசைத்திருவிழா': 'external',
    'நாட்டுப்புற இசை திருவிழா': 'external'
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
    const schedule = EVENT_TIME_MAP[rawEvent.title] || {};
    const internalSchedule = EVENT_INTERNAL_TIME_MAP[rawEvent.title] || {};
    const externalSchedule = EVENT_EXTERNAL_TIME_MAP[rawEvent.title] || {};
    const audienceType = rawEvent.audienceType || EVENT_AUDIENCE_TYPE_MAP[rawEvent.title] || 'both';

    return {
        id: rawEvent.id,
        name: rawEvent.title,
        slug: `event-${rawEvent.id}`,
        image: imagePath,
        icon: imagePath,
        tagline: rawEvent.tagline,
        description: descriptionParts.join(' | '),
        time: rawEvent.startTime || schedule.startTime || null,
        endTime: rawEvent.endTime || schedule.endTime || null,
        internalDate: rawEvent.internalDate || internalSchedule.date || rawEvent.date || null,
        internalTime: rawEvent.internalStartTime || internalSchedule.startTime || null,
        internalEndTime: rawEvent.internalEndTime || internalSchedule.endTime || null,
        externalDate: rawEvent.externalDate || externalSchedule.date || rawEvent.date || null,
        externalTime: rawEvent.externalStartTime || externalSchedule.startTime || null,
        externalEndTime: rawEvent.externalEndTime || externalSchedule.endTime || null,
        audienceType,
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
