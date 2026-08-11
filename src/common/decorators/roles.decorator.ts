import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles() Decorator - Marks endpoint with required role(s)
 *
 * Usage Examples:
 * @Roles('ADMIN')                    // Single role
 * @Roles('ADMIN', 'SUPER_ADMIN')     // Multiple roles (OR logic)
 *
 * Must be paired with RolesGuard:
 * @UseGuards(AuthGuard, RolesGuard)
 * @Roles('ADMIN')
 * @Get('/admin/users')
 * async getAdminUsers() { ... }
 *
 * Role Hierarchy:
 * SUPER_ADMIN   - Full system access
 * ADMIN         - Administrative operations
 * USER          - Standard user access
 * VENDOR        - Vendor/seller operations
 * GUEST         - Limited public access
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
