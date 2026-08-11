import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { JwtModule } from '@nestjs/jwt';

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
 * - JwtModule: Token generation
 */
@Module({
  imports: [
    UsersModule,
    TenantsModule,
    JwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
