import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

/**
 * TenantMiddleware
 *
 * Extracts tenant_id from JWT token and attaches to request
 * This allows services to filter queries by tenant automatically
 *
 * Flow:
 * 1. Extract Authorization header
 * 2. Verify JWT token
 * 3. Extract tenant_id from JWT payload
 * 4. Attach to req.user.tenant_id
 *
 * Usage: Applied globally in AppModule
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        next();
        return;
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        next();
        return;
      }

      // Verify and decode JWT
      const decoded = this.jwtService.verify(token);

      // Attach to request
      if (!req.user) {
        req.user = {};
      }
      (req.user as any).tenant_id = decoded.tenant_id;
      (req.user as any).id = decoded.sub;
      (req.user as any).email = decoded.email;
      (req.user as any).role = decoded.role;

      next();
    } catch (error) {
      // Token invalid, but allow request to continue
      // AuthGuard will handle it
      next();
    }
  }
}
