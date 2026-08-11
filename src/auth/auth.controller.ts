import { Body, Controller, Post, HttpStatus, HttpCode } from '@nestjs/common';
import { LoginDto } from '../users/dtos/login.dto';
import { VendorRegisterDto } from '../users/dtos/vendor-register.dto';
import { AuthService } from './auth.service';

/**
 * Auth Controller
 *
 * Handles:
 * - User login (with tenant_id in JWT)
 * - Vendor self-registration (creates tenant + user + JWT)
 *
 * Routes:
 * - POST /auth/login - Existing user login
 * - POST /auth/vendor/register - New vendor registration
 */
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) {}

    /**
     * POST /auth/login
     * User login endpoint
     *
     * Returns JWT with tenant_id included for multi-tenancy
     *
     * @body LoginDto { email, password }
     * @returns { user, access_token, tenant_id }
     */
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    /**
     * POST /auth/vendor/register
     * Vendor self-registration endpoint
     *
     * Creates:
     * 1. Tenant (vendor organization) - starts in trial status
     * 2. User (admin for that tenant)
     * 3. JWT token with tenant_id
     *
     * @body VendorRegisterDto {
     *   business_name,
     *   email,
     *   password,
     *   country?,
     *   currency?
     * }
     *
     * @returns {
     *   user,
     *   tenant,
     *   access_token,
     *   message
     * }
     */
    @Post('vendor/register')
    @HttpCode(HttpStatus.CREATED)
    async vendorRegister(@Body() dto: VendorRegisterDto) {
        return this.authService.vendorRegister(dto);
    }
}
