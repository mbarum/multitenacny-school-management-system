import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      const infoMessage = (info as { message?: string } | undefined)?.message;
      
      // DIAGNOSTIC: Print registered strategies
      const registeredStrategies = Object.keys((require('passport') as any)._strategies || {});
      console.log(`[LocalAuthGuard] Registered strategies: ${registeredStrategies.join(', ')}`);

      // Check for specific passport errors
      if (infoMessage === 'Unknown authentication strategy "local"') {
        throw new InternalServerErrorException(
          'Authentication configuration error: Local strategy not registered.',
        );
      }

      if (infoMessage) {
        throw new UnauthorizedException(`Authentication failed: ${infoMessage}`);
      }

      throw err || new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
