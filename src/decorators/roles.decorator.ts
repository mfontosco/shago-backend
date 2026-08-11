import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles() decorator - Marks endpoint as requiring specific role(s)
 *
 * Usage:
 * @Roles('ADMIN')
 * @Roles('ADMIN', 'SUPER_ADMIN')  // Multiple roles (OR logic)
 *
 * Must be paired with RolesGuard in @UseGuards()
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
