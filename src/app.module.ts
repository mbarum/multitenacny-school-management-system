import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

import { JwtModule } from '@nestjs/jwt';

import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './core/interceptors/audit.interceptor';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 20, // 20 requests per minute
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available application-wide
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST');
        const useSqlite = !dbHost || dbHost === 'your_production_database_host';

        if (useSqlite) {
          return {
            type: 'sqlite',
            database: 'database.sqlite',
            autoLoadEntities: true,
            synchronize: true, // Auto-create tables for SQLite
          };
        }

        return {
          type: 'mysql',
          host: dbHost,
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: false, // This must always be false in production.
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
  ],
  controllers: [], // Root controllers are removed for modularity
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
