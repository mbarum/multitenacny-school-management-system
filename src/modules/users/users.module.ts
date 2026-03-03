import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Permission, RolePermission]),
    TenancyModule,
  ],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], // Export TypeOrmModule for other modules to use entities if needed
})
export class UsersModule {}
