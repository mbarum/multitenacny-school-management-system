import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, DeepPartial, FindManyOptions, FindOneOptions } from 'typeorm';
import { TenancyService } from '../tenancy/tenancy.service';
import { TenantAwareEntity } from '../tenancy/tenant-aware.entity';

@Injectable()
export abstract class TenantAwareCrudService<T extends TenantAwareEntity> {
  protected constructor(
    private readonly repository: Repository<T>,
    protected readonly tenancyService: TenancyService,
  ) {}

  async create(createDto: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create({
      ...createDto,
      tenantId: this.tenancyService.getTenantId() as string,
    } as DeepPartial<T>);
    return this.repository.save(entity);
  }

  findAll(): Promise<T[]> {
    return this.repository.find({
      where: { tenantId: this.tenancyService.getTenantId() as string },
    } as FindManyOptions<T>);
  }

  async findOne(id: string): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id, tenantId: this.tenancyService.getTenantId() as string },
    } as FindOneOptions<T>);
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: DeepPartial<T>): Promise<T> {
    const entity = await this.findOne(id); // This already ensures tenant scope
    Object.assign(entity, updateDto);
    return this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id); // Ensures tenant scope
    await this.repository.remove(entity);
  }
}
