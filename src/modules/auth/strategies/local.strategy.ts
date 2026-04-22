import * as passportLocal from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import * as passport from 'passport';

@Injectable()
export class LocalStrategy extends PassportStrategy(passportLocal.Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
    
    // Failsafe: Manually register with the global passport singleton
    // This solves issues where @nestjs/passport and passport instance mismatches occur
    try {
      const passportInstance = require('passport');
      passportInstance.use('local', this as any);
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
