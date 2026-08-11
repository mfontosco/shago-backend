import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP Exception Filter
 *
 * Catches all HTTP exceptions and normalizes response format
 * Prevents stack traces from being exposed in production
 * Logs errors for monitoring/debugging
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract error details
    let message = exception.message;
    let errors: any[] = [];

    if (typeof exceptionResponse === 'object') {
      const exResponse = exceptionResponse as any;
      message = exResponse.message || message;
      errors = exResponse.error || (exResponse.errors ? [exResponse] : []);
    }

    // Log error (but not in production for security)
    this.logError(request, status, message, exception);

    // Build standardized error response
    const errorResponse = {
      statusCode: status,
      message: this.normalizeMessage(message, status),
      ...(errors.length > 0 && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private logError(
    request: Request,
    status: number,
    message: string,
    exception: HttpException,
  ) {
    const logData = {
      method: request.method,
      path: request.path,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      userAgent: request.get('user-agent'),
      ip: request.ip,
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.path} - ${status}`,
        exception.stack,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${request.method}] ${request.path} - ${status}: ${message}`,
      );
    }
  }

  private normalizeMessage(message: string, status: number): string {
    // Map common exceptions to user-friendly messages
    const messageMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Invalid request',
      [HttpStatus.UNAUTHORIZED]: 'Authentication required',
      [HttpStatus.FORBIDDEN]: 'Access denied',
      [HttpStatus.NOT_FOUND]: 'Resource not found',
      [HttpStatus.CONFLICT]: 'Resource conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Validation failed',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too many requests, please try again later',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal server error',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
    };

    return message && message !== 'Forbidden'
      ? message
      : messageMap[status] || 'An error occurred';
  }
}
