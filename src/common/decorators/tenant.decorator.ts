import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentTenant Decorator
 *
 * Usage:
 * @Get()
 * async findAll(@CurrentTenant() tenantId: string) { ... }
 *
 * Extracts tenant_id from:
 * 1. req.user.tenant_id (from JWT in TenantMiddleware)
 * 2. req.tenant_id (set by TenantGuard)
 *
 * Returns the tenant ID string for use in service calls
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenant_id || request.tenant_id;
  }
);
