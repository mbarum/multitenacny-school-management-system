
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Check if user exists
    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
        throw new UnauthorizedException('User no longer exists');
    }

    if (user.status === 'Disabled') {
        throw new UnauthorizedException('User account is disabled');
    }

    // Attach SchoolContext to the request
    return { 
        userId: payload.sub, 
        email: payload.email, 
        role: payload.role, 
        schoolId: user.schoolId // CRITICAL: This is used by all services to filter data
    };
  }
}
