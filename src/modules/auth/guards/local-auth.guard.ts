import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('emis-local') {
  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      const infoMessage = (info as { message?: string } | undefined)?.message;
      
      // DIAGNOSTIC: Print registered strategies
      const passportInstance = require('passport');
      const registeredStrategies = Object.keys(passportInstance._strategies || {});
      console.log(`[LocalAuthGuard] Registered strategies: ${registeredStrategies.join(', ')}`);

      // Check for specific passport errors
      if (infoMessage === 'Unknown authentication strategy "emis-local"' || infoMessage === 'Unknown authentication strategy "local"') {
        throw new InternalServerErrorException(
          `Authentication configuration error: 'emis-local' strategy not registered. Registered: ${registeredStrategies.join(', ')}`,
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
