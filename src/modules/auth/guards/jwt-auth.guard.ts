import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      const infoMessage = (info as { message?: string } | undefined)?.message;
      // Check for specific passport errors
      if (infoMessage === 'Unknown authentication strategy "jwt"') {
        throw new InternalServerErrorException(
          'Authentication configuration error: JWT strategy not registered.',
        );
      }

      if (infoMessage) {
        throw new UnauthorizedException(`Authentication failed: ${infoMessage}`);
      }

      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
