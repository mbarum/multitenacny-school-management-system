
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';
import { 
    User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
    Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
    GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
    Transaction, SchoolSetting, DarajaSetting, Book, LibraryTransaction, School, Subscription, PlatformSetting
} from '../entities/all-entities';

// Load .env from the server root directory
config({ path: join((process as any).cwd(), '.env') });

const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  host: configService.get<string>('MYSQL_HOST', 'localhost'),
  port: Number(configService.get<number | string>('MYSQL_PORT', 3306)),
  username: configService.get<string>('MYSQL_USER') || configService.get<string>('DB_USER', 'root'),
  password: configService.get<string>('MYSQL_PASSWORD') || configService.get<string>('MYSQL_ROOT_PASSWORD', ''),
  database: configService.get<string>('MYSQL_DATABASE') || configService.get<string>('DB_NAME', 'saaslink_db'),
  entities: [
    User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
    Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
    GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
    Transaction, SchoolSetting, DarajaSetting, Book, LibraryTransaction, School, Subscription, PlatformSetting
  ],
  migrations: [join((process as any).cwd(), 'src/migrations/*.{ts,js}')],
  synchronize: false, 
});
