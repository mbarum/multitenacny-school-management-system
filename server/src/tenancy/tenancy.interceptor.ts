
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenancyContext } from './tenancy.context';

@Injectable()
export class TenancyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const schoolId = request.user?.schoolId;

    if (schoolId) {
      return tenancyContext.run(schoolId, () => next.handle());
    }

    return next.handle();
  }
}
