import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import {
  SubscriptionStatus,
  SubscriptionPlan,
} from '../../common/subscription.enums';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const existing = await this.tenantRepository.findOne({
      where: [
        { name: createTenantDto.name },
        { domain: createTenantDto.domain },
      ],
    });
    if (existing) {
      throw new BadRequestException(
        'A school with this name or domain already exists.',
      );
    }

    const tenant = this.tenantRepository.create(createTenantDto);

    // If the plan is not free, they must pay before it becomes active
    if (tenant.plan && tenant.plan !== SubscriptionPlan.FREE) {
      tenant.subscriptionStatus = SubscriptionStatus.INACTIVE;
    } else {
      tenant.subscriptionStatus = SubscriptionStatus.ACTIVE;
    }

    const savedTenant = await this.tenantRepository.save(tenant);
    // Cache the new tenant
    await this.cacheManager.set(`tenant_${savedTenant.id}`, savedTenant);
    return savedTenant;
  }

  async findOne(id: string): Promise<Tenant> {
    const cachedTenant = await this.cacheManager.get<Tenant>(`tenant_${id}`);
    if (cachedTenant) {
      return cachedTenant;
    }

    const tenant = await this.tenantRepository.findOneBy({ id });
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }

    await this.cacheManager.set(`tenant_${id}`, tenant);
    return tenant;
  }

  async updateGradingMode(id: string, gradingMode: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    if (!['TRADITIONAL', 'CBE', 'HYBRID'].includes(gradingMode)) {
      throw new BadRequestException('Invalid grading mode');
    }
    tenant.gradingMode = gradingMode;
    const savedTenant = await this.tenantRepository.save(tenant);
    // Update cache
    await this.cacheManager.set(`tenant_${id}`, savedTenant);
    return savedTenant;
  }
}
