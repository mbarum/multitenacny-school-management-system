/// <reference types="node" />
import process from 'node:process';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as mysql from 'mysql2/promise';
import { getDatabaseCredentials, loadEnvConfig } from '../config/env-loader';
import { 
    User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, 
    MpesaC2BTransaction, Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, 
    Expense, FeeItem, Grade, GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, 
    SchoolEvent, TimetableEntry, Transaction, SchoolSetting, DarajaSetting,
    School, Subscription, Book, LibraryTransaction, PlatformSetting,
    SubscriptionPayment, MonthlyFinancial, AuditLog, EdTechArticle
} from '../entities/all-entities';

loadEnvConfig();
const dbCreds = getDatabaseCredentials();

console.log('---------------------------------------------------------');
console.log('⚡  SAASLINK AUTOMATED DATABASE SYNC & MIGRATION');
console.log(`📁  Active .env location: ${dbCreds.envFileUsed || 'Not found (using system environment)'}`);
console.log(`🌐  Target MySQL Host   : ${dbCreds.host}:${dbCreds.port}`);
console.log(`👤  Connecting as User  : ${dbCreds.username}`);
console.log(`🔑  Password Configured : ${dbCreds.password ? 'YES (length: ' + dbCreds.password.length + ' chars)' : 'NO / EMPTY'}`);
console.log(`🗄️   Target Database     : ${dbCreds.database}`);
console.log('---------------------------------------------------------');

async function autoCreateDatabaseIfMissing() {
    try {
        console.log(`⏳ Checking if database "${dbCreds.database}" exists in MySQL...`);
        const connection = await mysql.createConnection({
            host: dbCreds.host,
            port: dbCreds.port,
            user: dbCreds.username,
            password: dbCreds.password,
            database: undefined,
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbCreds.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.end();
        console.log(`✅ Database "${dbCreds.database}" verified/created automatically.`);
    } catch (err: any) {
        // Log notice if creation wasn't possible at root level, and proceed to TypeORM connection
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log(`ℹ️ User "${dbCreds.username}" does not have root CREATE DATABASE privileges; proceeding to connect directly to "${dbCreds.database}"...`);
        } else {
            console.log(`ℹ️ Notice during database check: ${err.message}. Proceeding...`);
        }
    }
}

const dataSourceOptions: DataSourceOptions = {
    type: 'mysql',
    host: dbCreds.host,
    port: dbCreds.port,
    username: dbCreds.username,
    password: dbCreds.password,
    database: dbCreds.database,
    entities: [
        User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
        Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
        GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
        Transaction, SchoolSetting, DarajaSetting, Book, LibraryTransaction, School, Subscription, PlatformSetting,
        SubscriptionPayment, MonthlyFinancial, AuditLog, EdTechArticle
    ],
    synchronize: true,
    dropSchema: false,
    logging: ['error', 'warn'],
};

const AppDataSource = new DataSource(dataSourceOptions);

async function sync() {
    try {
        await autoCreateDatabaseIfMissing();

        console.log(`⏳ Connecting to MySQL database "${dbCreds.database}"...`);
        await AppDataSource.initialize();
        console.log('✅ Connected to MySQL successfully.');
        
        console.log('🔄 Synchronizing all entity tables and schema columns...');
        await AppDataSource.synchronize();
        console.log('🎉 [SUCCESS] All database tables are created, migrated, and ready for production!');
        
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error: any) {
        console.error('❌ [ERROR] Database schema synchronization failed:');
        console.error(error.message || error);
        console.log('\n💡 Troubleshooting hint:');
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log(`👉 MySQL rejected access for user "${dbCreds.username}".`);
            console.log(`   Please verify MYSQL_USER and MYSQL_PASSWORD in your .env file at:`);
            console.log(`   ${dbCreds.envFileUsed || 'server/.env'}`);
            console.log(`   If your MySQL username or password is different, please update it in .env.`);
        }
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log(`👉 Database "${dbCreds.database}" does not exist in MySQL.`);
        }
        process.exit(1);
    }
}

sync();
