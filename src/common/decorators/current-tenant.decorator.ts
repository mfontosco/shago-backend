import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentTenant Decorator
 *
 * Extracts tenant_id from request and injects it as a parameter
 *
 * Usage:
 * async findAll(@CurrentTenant() tenantId: string) {
 *   // tenantId will be automatically injected
 * }
 *
 * Equivalent to manually doing:
 * const tenantId = request.user?.tenant_id || request.tenant_id
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Try multiple sources of tenant_id
    const tenantId =
      request.user?.tenant_id ||
      request.tenant_id ||
      request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new Error('Tenant ID not found in request context');
    }

    return tenantId;
  },
);
