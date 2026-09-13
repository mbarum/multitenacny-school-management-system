/// <reference types="node" />
import process from 'node:process';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getDatabaseCredentials, loadEnvConfig } from '../config/env-loader';
import { 
    User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, 
    MpesaC2BTransaction, Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, 
    Expense, FeeItem, Grade, GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, 
    SchoolEvent, TimetableEntry, Transaction, SchoolSetting, DarajaSetting,
    School, Subscription, Book, LibraryTransaction, PlatformSetting,
    SubscriptionPayment, MonthlyFinancial, AuditLog
} from '../entities/all-entities';

loadEnvConfig();
const dbCreds = getDatabaseCredentials();

console.log('---------------------------------------------------------');
console.log('⚡  SAASLINK DATABASE SYNC TOOL');
console.log(`📁  Active .env location: ${dbCreds.envFileUsed || 'Not found (using system environment)'}`);
console.log(`🌐  Target MySQL Host   : ${dbCreds.host}:${dbCreds.port}`);
console.log(`👤  Connecting as User  : ${dbCreds.username}`);
console.log(`🔑  Password Configured : ${dbCreds.password ? 'YES (length: ' + dbCreds.password.length + ' chars)' : 'NO / EMPTY'}`);
console.log(`🗄️   Target Database     : ${dbCreds.database}`);
console.log('---------------------------------------------------------');

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
        SubscriptionPayment, MonthlyFinancial, AuditLog
    ],
    synchronize: true,
    dropSchema: false,
    logging: ['error', 'warn'],
};

const AppDataSource = new DataSource(dataSourceOptions);

async function sync() {
    try {
        console.log(`⏳ Connecting to MySQL...`);
        await AppDataSource.initialize();
        console.log('✅ Connected to MySQL successfully.');
        
        console.log('🔄 Synchronizing all database tables (creating missing tables and columns)...');
        await AppDataSource.synchronize();
        console.log('🎉 [SUCCESS] All entity tables are created and synchronized in MySQL!');
        
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
            console.log(`   If your MySQL user is "saaslink_user", make sure MYSQL_USER=saaslink_user and not root.`);
        }
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log(`👉 Database "${dbCreds.database}" does not exist in MySQL.`);
            console.log(`   Run this in mysql: CREATE DATABASE ${dbCreds.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        }
        process.exit(1);
    }
}

sync();
