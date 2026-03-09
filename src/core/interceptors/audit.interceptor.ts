import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    sub: string;
    tenantId: string;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { method, url, user, ip, headers } = request;
    const body = request.body as Record<string, any>;

    // We only care about mutations
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data: { id?: string }) => {
        // Extract entity name from URL (simplified)
        const entity = url.split('/')[2] || 'unknown';

        const tenantId =
          user?.tenantId || (headers['x-tenant-id'] as string) || 'global';
        const userId = user?.sub || 'system';
        const entityId = (data?.id ||
          (body as { id?: string })?.id ||
          request.params?.id) as string;

        this.auditService
          .log({
            tenantId,
            userId,
            action: method,
            entity,
            entityId,
            newValue: JSON.stringify(body),
            ipAddress: ip,
            userAgent: headers['user-agent'],
          })
          .catch((err) => console.error('Audit logging failed', err));
      }),
    );
  }
}
