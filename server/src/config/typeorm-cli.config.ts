
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { 
    User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
    Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
    GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
    Transaction, SchoolSetting, DarajaSetting, Book, LibraryTransaction, School, Subscription, PlatformSetting,
    SubscriptionPayment, MonthlyFinancial, AuditLog
} from '../entities/all-entities';

// Load .env from current directory or server directory
config({ path: join(process.cwd(), '.env') });
config({ path: join(__dirname, '../../.env') });

const host = process.env.MYSQL_HOST || 'localhost';
const port = Number(process.env.MYSQL_PORT || 3306);
const username = process.env.MYSQL_USER || process.env.DB_USER || 'root';
const password = process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'saaslink_db';

export default new DataSource({
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
  migrations: [join(process.cwd(), 'src/migrations/*.{ts,js}')],
  synchronize: false, 
});
