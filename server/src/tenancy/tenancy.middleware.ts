
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenancyContext } from './tenancy.context';

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenancyMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    
    if (user && user.schoolId) {
      // Run the rest of the request within the tenancy context
      tenancyContext.run(user.schoolId, () => {
        next();
      });
    } else {
      // Continue without context (e.g. public routes or super admin)
      next();
    }
  }
}
