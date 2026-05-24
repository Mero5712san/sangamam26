const sequelize = require('../config/db');
const User = require('../models/User');

const users = [
    {
        name: 'Incharge User',
        email: 'incharge@sangamam.local',
        password: 'Incharge@123',
        role: 'incharge'
    },
    {
        name: 'Admin User',
        email: 'admin@sangamam.local',
        password: 'Admin@123',
        role: 'admin'
    }
];

async function seedUsers() {
    try {
        await sequelize.sync({ alter: true });

        for (const userData of users) {
            const [user, created] = await User.findOrCreate({
                where: { email: userData.email },
                defaults: userData
            });

            if (!created) {
                await user.update({
                    name: userData.name,
                    password: userData.password,
                    role: userData.role
                });
            }
        }

        console.log('Seeded 2 users into the Users table.');
        console.log('Incharge user: incharge@sangamam.local / Incharge@123');
        console.log('Admin user: admin@sangamam.local / Admin@123');
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed users:', error);
        process.exit(1);
    }
}

seedUsers();