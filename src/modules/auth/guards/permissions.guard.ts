import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from 'src/modules/users/entities/role-permission.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: any }>();
    const user = request.user;
    if (!user) return false;

    // Super Admin has all permissions
    if (user.role === 'SuperAdmin') return true;

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role: user.role, tenantId: user.tenantId as string },
      relations: ['permission'],
    });

    const userPermissions = rolePermissions.map((rp) => rp.permission.name);

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
