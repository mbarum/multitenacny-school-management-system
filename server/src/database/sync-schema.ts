/// <reference types="node" />
import 'dotenv/config';
import process from 'node:process';
import { DataSource, DataSourceOptions } from 'typeorm';
import { 
    User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, 
    MpesaC2BTransaction, Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, 
    Expense, FeeItem, Grade, GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, 
    SchoolEvent, TimetableEntry, Transaction, SchoolSetting, DarajaSetting,
    School, Subscription, Book, LibraryTransaction, PlatformSetting,
    SubscriptionPayment, MonthlyFinancial, AuditLog
} from '../entities/all-entities';

const host = process.env.MYSQL_HOST || 'localhost';
const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
const username = process.env.MYSQL_USER || process.env.DB_USER || 'root';
const password = process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'saaslink_db';

const dataSourceOptions: DataSourceOptions = {
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    entities: [
        User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
        Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
        GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
        Transaction, SchoolSetting, DarajaSetting, Book, LibraryTransaction, School, Subscription, PlatformSetting,
        SubscriptionPayment, MonthlyFinancial, AuditLog
    ],
    synchronize: true,
    dropSchema: false,
    logging: ['error', 'warn', 'schema'],
};

const AppDataSource = new DataSource(dataSourceOptions);

async function sync() {
    try {
        console.log(`[DB SYNC] Connecting to MySQL database "${database}" on ${host}:${port} as ${username}...`);
        await AppDataSource.initialize();
        console.log('[DB SYNC] Connected successfully.');
        
        console.log('[DB SYNC] Synchronizing entity tables with MySQL database...');
        await AppDataSource.synchronize();
        console.log('✅  [DB SYNC] All database tables have been successfully created/updated!');
        
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error: any) {
        console.error('❌  [DB SYNC] Database schema synchronization failed:');
        console.error(error.message || error);
        process.exit(1);
    }
}

sync();
