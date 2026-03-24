import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';

const dbHost = process.env.DB_HOST;

if (!dbHost || dbHost === 'your_production_database_host') {
  console.warn('WARNING: DB_HOST is not set. Migrations might fail if not connecting to a valid MySQL host.');
}

export default new DataSource({
  type: 'mysql',
  host: dbHost || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['src/modules/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
