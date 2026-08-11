import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../users/entities/user.entities';

/**
 * RolesGuard - Validates that user has required role(s)
 *
 * Usage in controller:
 * @UseGuards(AuthGuard, RolesGuard)
 * @Roles('ADMIN', 'SUPER_ADMIN')
 * @Get('/admin/users')
 * async getUsers() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (added by AuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user || !user.role) {
      throw new ForbiddenException(
        'User role not found. This endpoint requires authentication.',
      );
    }

    // Check if user's role is in required roles
    const hasRole = requiredRoles.includes(user.role.name);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}, but user has: ${user.role.name}`,
      );
    }

    return true;
  }
}
