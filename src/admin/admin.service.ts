import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entities';
import { Role } from '../roles/entities/role.entity';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private rolesService: RolesService,
    private permissionsService: PermissionsService,
  ) {}

  // ===== USER MANAGEMENT =====

  async getAllUsers() {
    return this.usersRepository.find({
      relations: ['role'],
      select: ['id', 'fullName', 'email', 'active', 'created_at', 'updated_at', 'role'],
    });
  }

  async getUserById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
      select: ['id', 'fullName', 'email', 'active', 'created_at', 'updated_at', 'role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async createUser(createUserDto: {
    email: string;
    fullName: string;
    password: string;
    roleId?: string;
  }) {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Find role if provided
    let role: Role | null = null;
    if (createUserDto.roleId) {
      role = await this.rolesRepository.findOne({
        where: { id: createUserDto.roleId },
      });
      if (!role) {
        throw new NotFoundException(
          `Role with ID ${createUserDto.roleId} not found`,
        );
      }
    }

    // Create user
    const user = this.usersRepository.create({
      email: createUserDto.email,
      fullName: createUserDto.fullName,
      password: hashedPassword,
      active: true,
      role: role || undefined,
    });

    const savedUser = await this.usersRepository.save(user);

    // Return user without password
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async updateUser(
    id: string,
    updateUserDto: {
      fullName?: string;
      email?: string;
      active?: boolean;
      roleId?: string;
    },
  ) {
    const user = await this.getUserById(id);

    // Update basic fields
    if (updateUserDto.fullName) {
      user.fullName = updateUserDto.fullName;
    }

    if (updateUserDto.email) {
      // Check if new email is unique
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException(
          'Email is already in use by another user',
        );
      }
      user.email = updateUserDto.email;
    }

    if (updateUserDto.active !== undefined) {
      user.active = updateUserDto.active;
    }

    // Update role if provided
    if (updateUserDto.roleId) {
      const role = await this.rolesRepository.findOne({
        where: { id: updateUserDto.roleId },
      });
      if (!role) {
        throw new NotFoundException(
          `Role with ID ${updateUserDto.roleId} not found`,
        );
      }
      user.role = role;
    }

    const updatedUser = await this.usersRepository.save(user);

    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: string) {
    const user = await this.getUserById(id);
    await this.usersRepository.remove(user);
  }

  // ===== ROLES MANAGEMENT =====

  async getAllRoles() {
    return this.rolesService.findAll();
  }

  async getRoleById(id: string) {
    const role = await this.rolesService.findOne(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async createRole(name: string, description: string) {
    // Check if role already exists
    const existingRole = await this.rolesService.findByName(name);
    if (existingRole) {
      throw new BadRequestException(
        `Role with name "${name}" already exists`,
      );
    }

    return this.rolesService.create(name, description);
  }

  async updateRole(id: string, name: string, description: string) {
    const role = await this.getRoleById(id);

    // Check if new name is unique
    if (name !== role.name) {
      const existingRole = await this.rolesService.findByName(name);
      if (existingRole) {
        throw new BadRequestException(
          `Role with name "${name}" already exists`,
        );
      }
    }

    return this.rolesService.update(id, name, description);
  }

  async deleteRole(id: string) {
    const role = await this.getRoleById(id);

    // Prevent deleting system roles
    const systemRoles = ['SUPER_ADMIN', 'ADMIN', 'USER'];
    if (systemRoles.includes(role.name)) {
      throw new BadRequestException(
        `Cannot delete system role "${role.name}"`,
      );
    }

    await this.rolesService.delete(id);
  }

  // ===== SYSTEM SETUP =====

  async seedDefaultData() {
    // Seed default roles
    await this.rolesService.seedDefaultRoles();

    // Seed default permissions
    await this.permissionsService.seedDefaultPermissions();

    return {
      message: 'Default roles and permissions have been seeded',
    };
  }
}
