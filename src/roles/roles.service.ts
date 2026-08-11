import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find({ relations: ['permissions'] });
  }

  async findOne(id: string): Promise<Role | null> {
    return this.rolesRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
  }

  async create(name: string, description: string): Promise<Role> {
    const role = this.rolesRepository.create({ name, description });
    return this.rolesRepository.save(role);
  }

  async update(id: string, name: string, description: string): Promise<Role | null> {
    await this.rolesRepository.update(id, { name, description });
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.rolesRepository.delete(id);
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<Role | null> {
    const role = await this.rolesRepository.findOne({ where: { id: roleId } });
    if (!role) {
      return null;
    }
    const permissions = await this.permissionsRepository.findByIds(permissionIds);
    role.permissions = permissions;
    return this.rolesRepository.save(role);
  }

  async seedDefaultRoles(): Promise<void> {
    const roles = [
      { name: 'SUPER_ADMIN', description: 'Full system access' },
      { name: 'ADMIN', description: 'Admin panel access' },
      { name: 'VENDOR', description: 'Seller/vendor account' },
      { name: 'USER', description: 'Regular customer account' },
      { name: 'GUEST', description: 'Guest/unauthenticated user' },
    ];

    for (const roleData of roles) {
      const existingRole = await this.findByName(roleData.name);
      if (!existingRole) {
        await this.create(roleData.name, roleData.description);
      }
    }
  }
}
