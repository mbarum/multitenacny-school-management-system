import { DataSource } from 'typeorm';
import { getDatabaseCredentials, loadEnvConfig } from './env-loader';
import { join } from 'path';
import { 
    User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
    Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
    GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
    Transaction, SchoolSetting, DarajaSetting, Book, LibraryTransaction, School, Subscription, PlatformSetting,
    SubscriptionPayment, MonthlyFinancial, AuditLog
} from '../entities/all-entities';

loadEnvConfig();
const dbCreds = getDatabaseCredentials();

export default new DataSource({
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
  migrations: [join(process.cwd(), 'src/migrations/*.{ts,js}')],
  synchronize: false, 
});
