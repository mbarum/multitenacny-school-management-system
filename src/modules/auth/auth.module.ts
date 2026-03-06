import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    UsersModule,
    TenantsModule,
    PassportModule.register({ defaultStrategy: 'local' }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {
  constructor(private readonly localStrategy: LocalStrategy) {
    console.log('AuthModule initialized');
  }
}
