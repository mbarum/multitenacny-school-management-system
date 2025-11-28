
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // Only log state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(() => {
          if (req.user && req.user.schoolId) {
            const path = req.route ? req.route.path : req.url;
            const resource = path.split('/')[2] || 'System'; // Simple heuristic to guess resource
            
            this.auditService.logAction({
              schoolId: req.user.schoolId,
              userId: req.user.userId,
              action: `${method} ${req.url}`,
              resource: resource,
              details: JSON.stringify(req.body ? Object.keys(req.body) : {}), // Log keys only for privacy/size
              ipAddress: req.ip || req.connection.remoteAddress,
            });
          }
        }),
      );
    }

    return next.handle();
  }
}
