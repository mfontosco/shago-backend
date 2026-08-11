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
 * Global Exception Filter - Catches ALL exceptions (HTTP and non-HTTP)
 *
 * Handles:
 * - HTTP exceptions (400, 401, 403, 404, 500, etc.)
 * - Database errors (TypeORM)
 * - Validation errors (class-validator)
 * - Unhandled exceptions
 *
 * Normalizes all responses to standard format
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const exResponse = exceptionResponse as any;
        message = exResponse.message || exception.message;
        errors = exResponse.errors || [];
      } else {
        message = exceptionResponse as string;
      }
    }
    // Handle database errors (TypeORM)
    else if (exception instanceof Error) {
      const err = exception as any;

      // PostgreSQL unique constraint violation
      if (err.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'This resource already exists';
        const match = err.detail?.match(/Key \((.*?)\)/);
        if (match) {
          errors = [{ field: match[1], message: 'Already exists' }];
        }
      }
      // PostgreSQL foreign key violation
      else if (err.code === '23503') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference to related resource';
      }
      // TypeORM entity not found
      else if (err.name === 'EntityNotFoundError') {
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
      } else {
        message = exception.message || 'Internal server error';
      }
    }

    // Log error
    this.logError(request, status, message, exception);

    // Build standardized error response
    const errorResponse = {
      statusCode: status,
      message: this.sanitizeMessage(message, status),
      ...(errors.length > 0 && { errors }),
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        path: request.url,
        method: request.method,
      }),
    };

    response.status(status).json(errorResponse);
  }

  private logError(
    request: Request,
    status: number,
    message: string,
    exception: unknown,
  ) {
    const context = {
      method: request.method,
      path: request.path,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      ip: request.ip,
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.path} - ${status}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    } else if (status >= 400) {
      this.logger.warn(`[${request.method}] ${request.path} - ${status}`, message);
    }
  }

  private sanitizeMessage(message: string, status: number): string {
    // In production, don't expose internal error details
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      return 'Internal server error';
    }

    return message;
  }
}
