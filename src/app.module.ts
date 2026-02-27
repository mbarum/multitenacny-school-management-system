import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 20, // 20 requests per minute
    }]),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 20, // 20 requests per minute
    }]),
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available application-wide
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true, // Automatically load entities from domain modules
        synchronize: false, // This must always be false in production.
      }),
      inject: [ConfigService],
    }),
    // Core Modules
    TenancyModule,

    // Domain modules will be imported here
    TenantsModule,
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
  ],
})
export class AppModule {}










