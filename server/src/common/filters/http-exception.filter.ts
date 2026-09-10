
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response as ExpressResponse } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>(); // Cast to any to avoid TS errors with response.status
    const request = ctx.getRequest<any>(); // Use any to bypass strict typing on request properties like originalUrl if not detected

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // In production, do not log stack traces for 4xx errors to reduce noise, 
    // but ALWAYS log 500 errors.
    if (status >= 500) {
      this.logger.error(
        `Http Status: ${status} Error Message: ${JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
        this.logger.warn(`Http Status: ${status} Error Message: ${JSON.stringify(message)} Path: ${request.originalUrl}`);
    }

    // Sanitize response for production (hide internal server details)
    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      message: (typeof message === 'object' && message !== null) ? message : { message },
    };

    response.status(status).json(responseBody);
  }
}
