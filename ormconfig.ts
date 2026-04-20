import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';

const dbHost = process.env.DB_HOST || 'localhost';

if (!dbHost || dbHost === 'your_production_database_host') {
  console.warn('WARNING: DB_HOST is not set correctly. Migrations might fail if not connecting to a valid MySQL host.');
}

export default new DataSource({
  type: 'mysql',
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'saaslink',
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
