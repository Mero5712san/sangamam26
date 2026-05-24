const sequelize = require('./config/db');
const User = require('./models/User');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');
        
        const users = await User.findAll({ where: { uuid: null } });
        console.log(`Found ${users.length} users without UUID`);
        
        for (const user of users) {
            user.uuid = uuidv4();
            await user.save();
            console.log(`Updated user ${user.email} with UUID ${user.uuid}`);
        }
        
        console.log('Migration complete');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
