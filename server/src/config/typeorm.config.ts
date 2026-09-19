import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseCredentials, loadEnvConfig } from './env-loader';
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
    // 1. Ensure env file is parsed directly from disk
    loadEnvConfig();
    const dbCreds = getDatabaseCredentials();

    const isProduction = (configService.get<string>('NODE_ENV') || process.env.NODE_ENV) === 'production';
    const forceSync = (configService.get<string>('DB_SYNCHRONIZE') || process.env.DB_SYNCHRONIZE) === 'true';
    const shouldSynchronize = forceSync || !isProduction;

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

    console.log('---------------------------------------------------------');
    console.log('🔌  [NESTJS TYPEORM] Initializing Database Connection...');
    console.log(`📁  Active .env location: ${dbCreds.envFileUsed || 'Not found'}`);
    console.log(`🌐  Target MySQL Host   : ${dbCreds.host}:${dbCreds.port}`);
    console.log(`👤  Connecting as User  : ${dbCreds.username}`);
    console.log(`🔑  Password Configured : ${dbCreds.password ? 'YES (' + dbCreds.password.length + ' chars)' : 'NO'}`);
    console.log(`🗄️   Target Database     : ${dbCreds.database}`);
    if (dbCreds.socketPath) {
      console.log(`🔌  UNIX Socket Path    : ${dbCreds.socketPath}`);
    }
    console.log('---------------------------------------------------------');

    if (dbCreds.url) {
      return {
        type: 'mysql',
        url: dbCreds.url,
        entities: commonEntities,
        synchronize: shouldSynchronize,
        logging: isProduction ? ['error', 'warn'] : ['error', 'warn'],
        autoLoadEntities: true,
        extra: poolConfig,
      };
    }

    if (dbCreds.socketPath) {
      return {
        type: 'mysql',
        socketPath: dbCreds.socketPath,
        username: dbCreds.username,
        password: dbCreds.password,
        database: dbCreds.database,
        entities: commonEntities,
        synchronize: shouldSynchronize,
        logging: isProduction ? ['error', 'warn'] : ['error', 'warn'],
        autoLoadEntities: true,
        extra: poolConfig,
      };
    }

    return {
      type: 'mysql',
      host: dbCreds.host,
      port: dbCreds.port,
      username: dbCreds.username,
      password: dbCreds.password,
      database: dbCreds.database,
      entities: commonEntities,
      synchronize: shouldSynchronize,
      logging: isProduction ? ['error', 'warn'] : ['error', 'warn'],
      autoLoadEntities: true,
      extra: poolConfig,
    };

  },
};
