import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';

const dbHost = process.env.DB_HOST;
const useSqlite = !dbHost || dbHost === 'your_production_database_host';

export default new DataSource(
  useSqlite
    ? {
        type: 'sqlite',
        database: 'database.sqlite',
        entities: ['src/modules/**/*.entity.ts'],
        migrations: ['src/migrations/*.ts'],
        migrationsTableName: 'migrations',
      }
    : {
        type: 'mysql',
        host: dbHost || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: ['src/modules/**/*.entity.ts'],
        migrations: ['src/migrations/*.ts'],
        migrationsTableName: 'migrations',
      },
);
