
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { 
    User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
    Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
    GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
    Transaction, SchoolSetting, DarajaSetting, Book, LibraryTransaction, School, Subscription, PlatformSetting,
    SubscriptionPayment, MonthlyFinancial
} from '../entities/all-entities';

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    const databaseUrl = configService.get<string>('DATABASE_URL');

    const commonEntities = [
      User, Staff, SchoolClass, Student, Subject, ClassSubjectAssignment, MpesaC2BTransaction, 
      Announcement, AttendanceRecord, ClassFee, CommunicationLog, Exam, Expense, FeeItem, Grade, 
      GradingRule, Payroll, PayrollEntry, PayrollItem, ReportShareLog, SchoolEvent, TimetableEntry, 
      Transaction, SchoolSetting, DarajaSetting, Book, LibraryTransaction, School, Subscription, PlatformSetting,
      SubscriptionPayment, MonthlyFinancial
    ];

    const poolConfig = {
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      idleTimeout: 60000,
      connectTimeout: 20000,
    };

    if (databaseUrl) {
      return {
        type: 'mysql',
        url: databaseUrl,
        entities: commonEntities,
        synchronize: !isProduction,
        logging: ['error', 'warn'],
        autoLoadEntities: true,
        extra: poolConfig,
      };
    }
    
    return {
      type: 'mysql',
      host: configService.get<string>('MYSQL_HOST', '127.0.0.1'),
      port: Number(configService.get<number | string>('MYSQL_PORT', 3306)),
      username: configService.get<string>('MYSQL_USER') || configService.get<string>('DB_USER', 'root'),
      password: configService.get<string>('MYSQL_PASSWORD') || configService.get<string>('MYSQL_ROOT_PASSWORD', ''),
      database: configService.get<string>('MYSQL_DATABASE') || configService.get<string>('DB_NAME', 'saaslink_db'),
      entities: commonEntities,
      synchronize: !isProduction, 
      logging: ['error', 'warn'],
      autoLoadEntities: true,
      extra: poolConfig,
    };
  },
};
