
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenancyContext } from './tenancy.context';

@Injectable()
export class TenancyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const schoolId = request.user?.schoolId;

    if (schoolId) {
      return new Observable(observer => {
        tenancyContext.run(schoolId, () => {
          next.handle().subscribe({
            next: (val) => observer.next(val),
            error: (err) => observer.error(err),
            complete: () => observer.complete(),
          });
        });
      });
    }

    return next.handle();
  }
}
