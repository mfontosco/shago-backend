import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionsRepository.find();
  }

  async findOne(id: string): Promise<Permission | null> {
    return this.permissionsRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.permissionsRepository.findOne({ where: { name } });
  }

  async create(
    name: string,
    description: string,
    resource: string,
    action: string,
  ): Promise<Permission> {
    const permission = this.permissionsRepository.create({
      name,
      description,
      resource,
      action,
    });
    return this.permissionsRepository.save(permission);
  }

  async update(
    id: string,
    name: string,
    description: string,
    resource: string,
    action: string,
  ): Promise<Permission | null> {
    await this.permissionsRepository.update(id, {
      name,
      description,
      resource,
      action,
    });
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.permissionsRepository.delete(id);
  }

  async seedDefaultPermissions(): Promise<void> {
    const permissions = [
      // User permissions
      {
        name: 'users.read',
        description: 'Read user data',
        resource: 'users',
        action: 'read',
      },
      {
        name: 'users.create',
        description: 'Create users',
        resource: 'users',
        action: 'create',
      },
      {
        name: 'users.update',
        description: 'Update users',
        resource: 'users',
        action: 'update',
      },
      {
        name: 'users.delete',
        description: 'Delete users',
        resource: 'users',
        action: 'delete',
      },

      // Product permissions
      {
        name: 'products.read',
        description: 'Read products',
        resource: 'products',
        action: 'read',
      },
      {
        name: 'products.create',
        description: 'Create products',
        resource: 'products',
        action: 'create',
      },
      {
        name: 'products.update',
        description: 'Update products',
        resource: 'products',
        action: 'update',
      },
      {
        name: 'products.delete',
        description: 'Delete products',
        resource: 'products',
        action: 'delete',
      },

      // Role permissions
      {
        name: 'roles.read',
        description: 'Read roles',
        resource: 'roles',
        action: 'read',
      },
      {
        name: 'roles.create',
        description: 'Create roles',
        resource: 'roles',
        action: 'create',
      },
      {
        name: 'roles.update',
        description: 'Update roles',
        resource: 'roles',
        action: 'update',
      },
      {
        name: 'roles.delete',
        description: 'Delete roles',
        resource: 'roles',
        action: 'delete',
      },
    ];

    for (const permData of permissions) {
      const existing = await this.findByName(permData.name);
      if (!existing) {
        await this.create(
          permData.name,
          permData.description,
          permData.resource,
          permData.action,
        );
      }
    }
  }
}
