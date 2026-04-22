import * as passportLocal from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import * as passport from 'passport';

@Injectable()
export class LocalStrategy extends PassportStrategy(passportLocal.Strategy, 'emis-local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
    
    // Failsafe: Manually register with the global passport singleton
    try {
      const passportInstance = require('passport');
      passportInstance.use('emis-local', this as any);
      passportInstance.use('local', this as any); // Backwards compatibility for ghost calls
    } catch (e) {
      console.warn('Manual passport registration skip/fail:', e.message);
    }
  }

  async validate(username: string, pass: string): Promise<any> {
    const user = await this.authService.validateUser(username, pass);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
