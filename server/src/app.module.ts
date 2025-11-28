
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
import { AuditModule } from './audit/audit.module'; // New
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { SubscriptionGuard } from './auth/subscription.guard'; // New
import { AuditInterceptor } from './common/interceptors/audit.interceptor'; // New
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { School } from './entities/school.entity'; // For SubGuard

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    TypeOrmModule.forFeature([School]), // Needed for SubscriptionGuard
    // Rate Limiting: Max 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    // Serve React Frontend (Build output)
    ServeStaticModule.forRoot({
      rootPath: join((process as any).cwd(), '..', 'dist'), // Points to the frontend build folder relative to server root
      exclude: ['/api/(.*)'], // Don't serve index.html for API routes
    }),
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
    AuditModule, // Register Audit
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
      useClass: SubscriptionGuard, // Enforce SaaS status
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor, // Auto-log actions
    },
  ],
})
export class AppModule {}
