import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

/**
 * Seeding Service - Initializes database with default roles and permissions
 *
 * Run with: npm run seed
 * Or manually call seeding through admin endpoint
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('🌱 Starting database seed...');

    try {
      await this.seedPermissions();
      await this.seedRoles();
      this.logger.log('✅ Database seed completed successfully');
    } catch (error) {
      this.logger.error('❌ Seed failed:', error);
      throw error;
    }
  }

  private async seedPermissions(): Promise<void> {
    this.logger.log('📝 Seeding permissions...');

    // Define all permissions (resource:action format)
    const permissionsData = [
      // User permissions
      { resource: 'users', action: 'read', description: 'Read user data' },
      { resource: 'users', action: 'create', description: 'Create user accounts' },
      { resource: 'users', action: 'update', description: 'Update user data' },
      { resource: 'users', action: 'delete', description: 'Delete users' },

      // Product permissions
      { resource: 'products', action: 'read', description: 'View products' },
      { resource: 'products', action: 'create', description: 'Create products' },
      { resource: 'products', action: 'update', description: 'Update products' },
      { resource: 'products', action: 'delete', description: 'Delete products' },

      // Category permissions
      { resource: 'categories', action: 'read', description: 'View categories' },
      { resource: 'categories', action: 'create', description: 'Create categories' },
      { resource: 'categories', action: 'update', description: 'Update categories' },
      { resource: 'categories', action: 'delete', description: 'Delete categories' },

      // Admin permissions
      { resource: 'admin', action: 'read', description: 'Access admin panel' },
      { resource: 'admin', action: 'manage-roles', description: 'Manage roles' },
      { resource: 'admin', action: 'manage-permissions', description: 'Manage permissions' },
      { resource: 'admin', action: 'view-audit-logs', description: 'View audit logs' },

      // Feature flag permissions
      { resource: 'features', action: 'read', description: 'View feature flags' },
      { resource: 'features', action: 'manage', description: 'Manage feature flags' },

      // Role management
      { resource: 'roles', action: 'read', description: 'View roles' },
      { resource: 'roles', action: 'create', description: 'Create roles' },
      { resource: 'roles', action: 'update', description: 'Update roles' },
      { resource: 'roles', action: 'delete', description: 'Delete roles' },
    ];

    for (const permData of permissionsData) {
      const permissionName = `${permData.resource}:${permData.action}`;
      const exists = await this.permissionRepository.findOne({
        where: { name: permissionName },
      });

      if (!exists) {
        await this.permissionRepository.save({
          name: permissionName,
          ...permData,
        });
        this.logger.debug(`✓ Created permission: ${permissionName}`);
      }
    }

    this.logger.log(`✓ Permissions seeded`);
  }

  private async seedRoles(): Promise<void> {
    this.logger.log('👥 Seeding roles...');

    // Get all permissions for role assignment
    const allPermissions = await this.permissionRepository.find();

    const rolesData = [
      {
        name: 'SUPER_ADMIN',
        description: 'Full system access',
        permissionFilter: () => allPermissions, // All permissions
      },
      {
        name: 'ADMIN',
        description: 'Administrative operations',
        permissionFilter: () =>
          allPermissions.filter(p =>
            !p.resource.includes('system') && p.resource !== 'admin'
          ),
      },
      {
        name: 'USER',
        description: 'Standard user access',
        permissionFilter: () =>
          allPermissions.filter(p =>
            ['products', 'categories', 'users'].includes(p.resource) &&
            ['read'].includes(p.action)
          ),
      },
      {
        name: 'VENDOR',
        description: 'Vendor/seller operations',
        permissionFilter: () =>
          allPermissions.filter(p =>
            ['products', 'categories'].includes(p.resource)
          ),
      },
      {
        name: 'GUEST',
        description: 'Limited public access',
        permissionFilter: () =>
          allPermissions.filter(p =>
            ['products', 'categories'].includes(p.resource) && p.action === 'read'
          ),
      },
    ];

    for (const roleData of rolesData) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = this.roleRepository.create({
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissionFilter(),
        });

        await this.roleRepository.save(role);
        this.logger.debug(
          `✓ Created role: ${roleData.name} with ${role.permissions.length} permissions`,
        );
      } else {
        this.logger.debug(`⊘ Role already exists: ${roleData.name}`);
      }
    }

    this.logger.log(`✓ Roles seeded`);
  }

  /**
   * Reset database - removes all roles and permissions
   * USE WITH CAUTION - Only for development
   */
  async reset(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production');
    }

    this.logger.warn('⚠️ Resetting database...');

    // Remove all roles (permissions will cascade delete)
    await this.roleRepository.delete({});
    await this.permissionRepository.delete({});

    this.logger.log('✓ Database reset complete');
  }
}
