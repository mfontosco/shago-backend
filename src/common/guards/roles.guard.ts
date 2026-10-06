import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../users/entities/user.entities';

/**
 * RolesGuard - Validates that user has required role(s)
 *
 * Usage:
 * @UseGuards(RolesGuard)
 * @Roles('ADMIN', 'SUPER_ADMIN')
 * @Get('/admin/users')
 * async getUsers() { ... }
 *
 * Note: AuthGuard should be applied first to populate user object
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @Roles() decorator applied, allow access (relies on AuthGuard)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get authenticated user from request (populated by AuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user as Omit<User, 'role'> & { role?: string | { name: string } };

    // User must exist and have a role (AuthGuard should ensure this)
    if (!user) {
      throw new ForbiddenException(
        'Authentication required. Please log in first.',
      );
    }

    // JWT payloads (TenantMiddleware / JwtAuthGuard) carry the role as a plain string;
    // a hydrated User entity carries a Role object
    const roleName = typeof user.role === 'string' ? user.role : user.role?.name;

    if (!roleName) {
      throw new ForbiddenException(
        'User role not assigned. Contact administrator.',
      );
    }

    // Check if user's role is in required roles list
    const hasRequiredRole = requiredRoles.includes(roleName);

    if (!hasRequiredRole) {
      const rolesList = requiredRoles.join(', ');
      throw new ForbiddenException(
        `Access denied. This endpoint requires one of the following roles: ${rolesList}. Your role: ${roleName}`,
      );
    }

    return true;
  }
}
