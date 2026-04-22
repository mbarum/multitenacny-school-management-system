import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SharedModule } from '../../shared/shared.module';
import * as passport from 'passport';

@Module({
  imports: [
    SharedModule,
    UsersModule,
    TenantsModule,
    PassportModule.register({ session: false, global: true }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, PassportModule, LocalStrategy],
})
export class AuthModule implements OnApplicationBootstrap {
  constructor(private localStrategy: LocalStrategy) {}

  onApplicationBootstrap() {
    const passportInstance = require('passport');
    const isLocalRegistered = passportInstance._strategies?.['emis-local'];
    if (!isLocalRegistered) {
      console.warn('[AuthModule] emis-local strategy NOT found in passport registry at bootstrap. Forcing registration...');
      // Register both names to be 100% sure
      passportInstance.use('emis-local', this.localStrategy);
      passportInstance.use('local', this.localStrategy);
    } else {
      console.log('[AuthModule] emis-local strategy successfully verified in passport registry.');
    }
  }
}
