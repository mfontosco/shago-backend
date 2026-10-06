import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../users/dtos/login.dto';
import { VendorRegisterDto } from '../users/dtos/vendor-register.dto';
import { User } from '../users/entities/user.entities';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/services/tenants.service';
import { RolesService } from '../roles/roles.service';
import  * as bcrypt from "bcrypt"

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly tenantsService: TenantsService,
        private readonly rolesService: RolesService,
        private readonly jwtService: JwtService
    ){}

    async login(dto: LoginDto) {
        const { email, password } = dto;
        const user = await this.userService.findUserByEmail(email, true);

        if (!user) {
            throw new UnauthorizedException("invalid user details, verify your email");
        }

        if (!user.password) {
            throw new UnauthorizedException("invalid user details, verify your email");
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException("password mismatch");
        }

        if (!user.tenant_id) {
            throw new UnauthorizedException("user account is not associated with a vendor. please re-register.");
        }

        const { password: _, role, ...userWithoutPassword } = user;
        const roleName = role?.name;

        // ✅ CRITICAL: Include tenant_id in JWT payload for multi-tenancy
        // role is read by RolesGuard via TenantMiddleware
        const payload = {
            sub: user.id,
            email: user.email,
            tenant_id: user.tenant_id,
            role: roleName,
        };
        const access_token = await this.jwtService.signAsync(payload);

        // Shape matches the vendor, main and rider app clients: { access_token, user }
        return {
            user: { ...userWithoutPassword, role: roleName },
            access_token,
            tenant_id: user.tenant_id,
        };
    }

    /**
     * Vendor Self-Registration
     *
     * Creates both:
     * 1. Tenant (vendor organization)
     * 2. User (admin user for that tenant)
     * 3. JWT token with tenant_id
     *
     * Flow:
     * 1. Validate email not already in use
     * 2. Create tenant with trial status
     * 3. Create admin user for tenant
     * 4. Return JWT with tenant_id included
     */
    async vendorRegister(dto: VendorRegisterDto) {
        // 1️⃣ Validate email is not already in use
        const existingUser = await this.userService.findUserByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Resolve the ADMIN role before creating anything, so we never leave a role-less user behind
        const adminRole = await this.rolesService.findByName('ADMIN');
        if (!adminRole) {
            throw new InternalServerErrorException('ADMIN role not found. Run `npm run seed` to create default roles.');
        }

        // 2️⃣ Create tenant (vendor organization)
        const tenant = await this.tenantsService.create({
            name: dto.business_name,
            country: dto.country,
            currency: dto.currency,
        });

        // 3️⃣ Create admin user for the tenant
        const hashedPassword = bcrypt.hashSync(dto.password, 10);

        const user = await this.userService.createUser({
            email: dto.email,
            password: hashedPassword,
            first_name: dto.first_name || '',
            last_name: dto.last_name || '',
            phone: dto.phone || '',
            tenant_id: tenant.id,  // ← Assign to tenant
            role_id: adminRole.id,  // ← First user is admin of their tenant
        });

        // Increment tenant user count
        await this.tenantsService.incrementUserCount(tenant.id);

        // 4️⃣ Create JWT with tenant_id
        const payload = {
            sub: user.id,
            email: user.email,
            tenant_id: user.tenant_id,  // ← Critical for multi-tenancy
            role: adminRole.name,
        };
        const access_token = await this.jwtService.signAsync(payload);

        // Return registration response
        const { password: _, role: __, ...userWithoutPassword } = user;

        return {
            user: { ...userWithoutPassword, role: adminRole.name },
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                currency: tenant.currency,
                status: tenant.status,
                plan: tenant.plan,
            },
            access_token,
            message: 'Vendor registration successful! Your trial period starts now.',
        };
    }
}
