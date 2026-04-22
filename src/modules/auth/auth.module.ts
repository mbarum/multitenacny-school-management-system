import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SharedModule } from '../../shared/shared.module';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SubscriptionGuard } from './guards/subscription.guard';

@Global()
@Module({
  imports: [
    SharedModule,
    UsersModule,
    TenantsModule,
    PassportModule.register({ session: false, global: true }),
  ],
  providers: [
    AuthService, 
    LocalStrategy, 
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    SubscriptionGuard
  ],
  controllers: [AuthController],
  exports: [AuthService, PassportModule, LocalStrategy, JwtAuthGuard, RolesGuard, SubscriptionGuard],
})
export class AuthModule {}
