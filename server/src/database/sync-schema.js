// CommonJS runner for syncing MySQL database schema directly with Node.js
// Bypasses any ts-node TypeScript compilation issues in production
require('dotenv').config();
const path = require('path');
const { DataSource } = require('typeorm');

// Check for compiled entities in dist/ or compile on the fly if needed
let allEntities;
try {
    allEntities = require('../entities/all-entities');
} catch (e) {
    try {
        allEntities = require('../../dist/entities/all-entities');
    } catch (e2) {
        console.error('Entity load error:', e.message);
    }
}

const host = process.env.MYSQL_HOST || 'localhost';
const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
const username = process.env.MYSQL_USER || process.env.DB_USER || 'root';
const password = process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'saaslink_db';

const entitiesList = allEntities ? Object.values(allEntities).filter(item => typeof item === 'function') : [];

const AppDataSource = new DataSource({
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    entities: entitiesList.length > 0 ? entitiesList : [path.join(__dirname, '../../dist/**/*.entity.js')],
    synchronize: true,
    dropSchema: false,
    logging: ['error', 'warn', 'schema'],
});

async function run() {
    try {
        console.log(`[DB SYNC] Connecting to MySQL database "${database}" at ${host}:${port} as user "${username}"...`);
        await AppDataSource.initialize();
        console.log('[DB SYNC] Connected to MySQL successfully.');
        
        console.log('[DB SYNC] Synchronizing table schemas...');
        await AppDataSource.synchronize();
        console.log('✅  [DB SYNC] All database tables created or verified successfully!');
        
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌  [DB SYNC] Schema synchronization failed:');
        console.error(error.message || error);
        process.exit(1);
    }
}

if (require.main === module) {
    run();
}

module.exports = { AppDataSource, run };
