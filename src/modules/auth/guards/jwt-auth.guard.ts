import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  tenantId?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any }>();
    const authHeader = request.headers.authorization;

    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token) as JwtPayload;

      // Attach user to request for use in controllers and other guards
      // We use findById to bypass tenant check since we are currently authenticating the user
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
