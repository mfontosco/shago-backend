import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { RolesModule } from '../roles/roles.module';

/**
 * Auth Module
 *
 * Handles:
 * - User authentication (login)
 * - Vendor registration (creates tenant + user)
 * - JWT token generation with tenant_id
 *
 * Dependencies:
 * - UsersModule: User management
 * - TenantsModule: Tenant/vendor management
 * - JwtModule: Imported globally from app.module (no need to import here)
 */
@Module({
  imports: [
    UsersModule,
    TenantsModule,
    RolesModule,
    // JwtModule is global in app.module, no need to import here
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
