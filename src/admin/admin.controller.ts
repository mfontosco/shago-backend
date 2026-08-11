import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===== USERS MANAGEMENT =====

  @Get('users')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllUsers() {
    return {
      success: true,
      message: 'Users retrieved successfully',
      data: await this.adminService.getAllUsers(),
    };
  }

  @Get('users/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getUserById(@Param('id') id: string) {
    const user = await this.adminService.getUserById(id);
    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Post('users')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: any) {
    const user = await this.adminService.createUser(createUserDto);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Patch('users/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: any) {
    const user = await this.adminService.updateUser(id, updateUserDto);
    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete('users/:id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    await this.adminService.deleteUser(id);
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  // ===== ROLES MANAGEMENT =====

  @Get('roles')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllRoles() {
    return {
      success: true,
      message: 'Roles retrieved successfully',
      data: await this.adminService.getAllRoles(),
    };
  }

  @Get('roles/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getRoleById(@Param('id') id: string) {
    const role = await this.adminService.getRoleById(id);
    return {
      success: true,
      message: 'Role retrieved successfully',
      data: role,
    };
  }

  @Post('roles')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createRole(@Body() createRoleDto: any) {
    const role = await this.adminService.createRole(
      createRoleDto.name,
      createRoleDto.description,
    );
    return {
      success: true,
      message: 'Role created successfully',
      data: role,
    };
  }

  @Patch('roles/:id')
  @Roles('SUPER_ADMIN')
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: any) {
    const role = await this.adminService.updateRole(
      id,
      updateRoleDto.name,
      updateRoleDto.description,
    );
    return {
      success: true,
      message: 'Role updated successfully',
      data: role,
    };
  }

  @Delete('roles/:id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('id') id: string) {
    await this.adminService.deleteRole(id);
    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }

  // ===== SYSTEM SETUP =====

  @Post('seed-default-roles')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async seedDefaultRoles() {
    await this.adminService.seedDefaultData();
    return {
      success: true,
      message: 'Default roles and permissions seeded successfully',
    };
  }
}
