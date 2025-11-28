
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async logAction(data: Partial<AuditLog>) {
    // Fire and forget - don't await to avoid blocking the main request flow too long
    const log = this.auditRepo.create(data);
    this.auditRepo.save(log).catch(err => console.error('Audit Log Failed', err));
  }

  async findAll(schoolId: string, limit = 50) {
    return this.auditRepo.find({
      where: { schoolId: schoolId as any },
      order: { timestamp: 'DESC' },
      take: limit,
      relations: ['user']
    });
  }
}
