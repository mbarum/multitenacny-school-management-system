import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/user-role.enum';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
    role: string;
    tenantId: string;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT)
  getCurrent(@Req() req: AuthenticatedRequest) {
    return this.tenantsService.findOne(req.user.tenantId);
  }

  @Patch('current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  updateCurrent(@Req() req: AuthenticatedRequest, @Body() updateData: any) {
    return this.tenantsService.update(req.user.tenantId, updateData);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.tenantsService.update(id, updateData);
  }

  @Patch(':id/grading-mode')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  updateGradingMode(
    @Param('id') id: string,
    @Body('gradingMode') gradingMode: string,
  ) {
    return this.tenantsService.updateGradingMode(id, gradingMode);
  }
}
