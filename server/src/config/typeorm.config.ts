
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { 
    User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
    Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
    GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
    Transaction, SchoolSetting, DarajaSetting
} from '../entities/all-entities';

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    
    return {
      type: 'mysql',
      host: configService.get<string>('MYSQL_HOST', '127.0.0.1'),
      port: configService.get<number>('MYSQL_PORT', 3306),
      username: configService.get<string>('MYSQL_USER', 'root'),
      password: configService.get<string>('MYSQL_ROOT_PASSWORD', ''),
      database: configService.get<string>('MYSQL_DATABASE', 'saaslink_db'),
      entities: [
        User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
        Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
        GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
        Transaction, SchoolSetting, DarajaSetting
      ],
      // CRITICAL: synchronize must be FALSE in production to avoid dropping data.
      // Use migrations for schema updates in production.
      synchronize: !isProduction, 
      logging: !isProduction ? ['error', 'warn'] : ['error'],
      autoLoadEntities: true,
    };
  },
};