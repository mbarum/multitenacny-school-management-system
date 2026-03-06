import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

import * as passport from 'passport';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
    console.log('LocalStrategy constructor called');
    // Manual registration as a fallback to ensure strategy is registered with the passport instance
    (passport as any).use('local', this);
  }

  async validate(username: string, pass: string): Promise<unknown> {
    const user = await this.authService.validateUser(username, pass);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
