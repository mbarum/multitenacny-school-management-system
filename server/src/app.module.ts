
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { AiModule } from './ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { SettingsModule } from './settings/settings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ExpensesModule } from './expenses/expenses.module';
import { StaffModule } from './staff/staff.module';
import { AcademicsModule } from './academics/academics.module';
import { PayrollModule } from './payroll/payroll.module';
import { CommunicationsModule } from './communications/communications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { EventsModule } from './events/events.module';
import { LibraryModule } from './library/library.module';
import { TasksModule } from './tasks/tasks.module';
import { SuperAdminModule } from './super-admin/super-admin.module'; // Import
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { SubscriptionGuard } from './auth/subscription.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { School } from './entities/school.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    TypeOrmModule.forFeature([School]),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    CacheModule.register({
      isGlobal: true,
      ttl: 60000,
      max: 100,
    }),
    ServeStaticModule.forRoot({
      rootPath: join((process as any).cwd(), '..', 'dist'),
      exclude: ['/api/(.*)'],
    }),
    ScheduleModule.forRoot(),
    AuthModule, 
    UsersModule, 
    StudentsModule, 
    AiModule,
    SettingsModule,
    TransactionsModule,
    ExpensesModule,
    StaffModule,
    AcademicsModule,
    PayrollModule,
    CommunicationsModule,
    DashboardModule,
    AuditModule,
    EventsModule,
    LibraryModule,
    TasksModule,
    SuperAdminModule, // Register
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
