import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LmsModule } from './modules/lms/lms.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { MpesaModule } from './modules/mpesa/mpesa.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { TenancyModule } from './core/tenancy/tenancy.module';
import { StudentsModule } from './modules/students/students.module';
import { FeesModule } from './modules/fees/fees.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { StaffModule } from './modules/staff/staff.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { ReportCardsModule } from './modules/report-cards/report-cards.module';
import { LibraryModule } from './modules/library/library.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { SharedModule } from './shared/shared.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AppConfigModule } from './modules/config/config.module';
import { FinanceModule } from './modules/finance/finance.module';

import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './core/interceptors/audit.interceptor';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CbeModule } from './modules/cbe/cbe.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MediaModule } from './modules/media/media.module';

import { TenantThrottlerGuard } from './core/guards/tenant-throttler.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // Shared global capacity
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT');

        // Use memory store if Redis is not configured or in placeholder state
        if (
          !redisHost ||
          redisHost === 'localhost' ||
          redisHost === 'your_redis_host'
        ) {
          return {
            store: 'memory',
            ttl: 300,
          };
        }

        return {
          store: await redisStore({
            socket: {
              host: redisHost,
              port: redisPort || 6379,
            },
            password: configService.get('REDIS_PASSWORD'),
            ttl: 300,
          }),
          ttl: 300,
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST');

        // If Redis is missing, Bull will fail. We'll use a dummy/local config or warn.
        // For AIS environment, we usually expect Redis if Bull is used,
        // but we'll fallback to localhost to at least allow bootstrap if it's there.
        return {
          connection: {
            host:
              redisHost === 'your_redis_host'
                ? 'localhost'
                : redisHost || 'localhost',
            port: configService.get<number>('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD', ''),
          },
        };
      },
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        let secret = configService.get<string>('JWT_SECRET');
        if (!secret || secret.includes('your_super_secret_key')) {
          secret = 'dev_secret_key_at_least_32_characters_long_for_safety';
        }
        return {
          secret,
          signOptions: { expiresIn: '60m' },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        let dbHost = configService.get<string>('DB_HOST') || 'localhost';

        if (dbHost === 'your_production_database_host') {
          dbHost = 'localhost';
          console.warn(
            'WARNING: DB_HOST is a placeholder. Falling back to localhost.',
          );
        }

        return {
          type: 'mysql',
          host: dbHost,
          port: configService.get<number>('DB_PORT') || 3306,
          username:
            configService.get<string>('DB_USERNAME') ===
            'your_production_database_username'
              ? 'root'
              : configService.get<string>('DB_USERNAME') || 'root',
          password:
            configService.get<string>('DB_PASSWORD') ===
            'your_production_database_password'
              ? ''
              : configService.get<string>('DB_PASSWORD') || '',
          database:
            configService.get<string>('DB_DATABASE') ===
            'your_production_database_name'
              ? 'saaslink'
              : configService.get<string>('DB_DATABASE') || 'saaslink',
          autoLoadEntities: true,
          synchronize: true, // Force synchronization to resolve missing columns
        };
      },
      inject: [ConfigService],
    }),
    // Core Modules
    TenancyModule,
    AuditModule,

    // Domain modules will be imported here
    TenantsModule,
    LmsModule,
    SubscriptionsModule,
    MpesaModule,
    SuperAdminModule,
    StudentsModule,
    FeesModule,
    ExpensesModule,
    StaffModule,
    PayrollModule,
    AcademicsModule,
    TimetableModule,
    AttendanceModule,
    CalendarModule,
    ExaminationsModule,
    ReportCardsModule,
    LibraryModule,
    CommunicationModule,
    ReportingModule,
    SharedModule,

    // Auth & Users
    UsersModule,
    AuthModule,

    // Payments
    PaymentsModule,
    FinanceModule,

    // Config
    AppConfigModule,

    CbeModule,
    JobsModule,
    MediaModule,
  ],
  controllers: [], // Root controllers are removed for modularity
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
