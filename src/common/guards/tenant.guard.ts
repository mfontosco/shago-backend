import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * TenantGuard
 *
 * Ensures user belongs to the requested tenant
 *
 * Validation:
 * 1. Extract tenant_id from request user (from JWT via TenantMiddleware)
 * 2. If URL has ?tenant_id=..., verify it matches user's tenant
 * 3. Reject if trying to access different tenant's data
 *
 * Usage: Add to controller:
 * @UseGuards(TenantGuard, RolesGuard)
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User must be authenticated and have tenant_id
    if (!user || !user.tenant_id) {
      throw new ForbiddenException('Tenant information not found in token');
    }

    // If tenant_id is in query params, verify it matches user's tenant
    const queryTenantId = request.query?.tenant_id;
    if (queryTenantId && queryTenantId !== user.tenant_id) {
      throw new ForbiddenException(
        'Unauthorized: Cannot access different tenant data'
      );
    }

    // If tenant_id is in body, verify it matches
    const bodyTenantId = request.body?.tenant_id;
    if (bodyTenantId && bodyTenantId !== user.tenant_id) {
      throw new ForbiddenException(
        'Unauthorized: Cannot access different tenant data'
      );
    }

    // Attach tenant_id to request for use in controllers/services
    request.tenant_id = user.tenant_id;

    return true;
  }
}
