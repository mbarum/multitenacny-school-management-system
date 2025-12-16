
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET not found in env.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // Always fetch the latest user record from the database to check for role changes or bans
    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
        throw new UnauthorizedException('User no longer exists');
    }

    if (user.status === 'Disabled') {
        throw new UnauthorizedException('User account is disabled');
    }

    // Return the role from the DB, not the token. This allows immediate role updates (like promoting to SuperAdmin)
    return { 
        userId: payload.sub, 
        email: payload.email, 
        role: user.role, 
        schoolId: user.schoolId 
    };
  }
}
