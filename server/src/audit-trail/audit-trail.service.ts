import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialAuditLog, AdminAuditLog, FinancialActionType } from './entities';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class AuditTrailService {
  constructor(
    @InjectRepository(FinancialAuditLog) private finAuditRepo: Repository<FinancialAuditLog>,
    @InjectRepository(AdminAuditLog) private adminAuditRepo: Repository<AdminAuditLog>,
  ) {}

  private calculateHash(data: any, previousHash: string | null = null): string {
    const dataString = JSON.stringify(data) + (previousHash || '');
    return CryptoJS.SHA256(dataString).toString(CryptoJS.enc.Hex);
  }

  async recordFinancialAction(actionType: FinancialActionType, details: Record<string, any>, userId: string, schoolId: string): Promise<void> {
    const lastLog = await this.finAuditRepo.findOne({ where: { schoolId }, order: { createdAt: 'DESC' } });
    const previousHash = lastLog ? lastLog.hash : null;

    const logData = { actionType, details, userId, schoolId, createdAt: new Date() };
    const hash = this.calculateHash(logData, previousHash);

    const newLog = this.finAuditRepo.create({ ...logData, hash, previousHash: previousHash || undefined });
    await this.finAuditRepo.save(newLog);
  }

  async recordAdminAction(action: string, userId: string, schoolId: string, details?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void> {
    const newLog = this.adminAuditRepo.create({ action, userId, schoolId, details, ipAddress, userAgent });
    await this.adminAuditRepo.save(newLog);
  }

  async verifyFinancialAuditTrail(schoolId: string): Promise<{ isValid: boolean; errors: string[] }> {
    const logs = await this.finAuditRepo.find({ where: { schoolId }, order: { createdAt: 'ASC' } });
    const errors: string[] = [];
    let previousHash: string | null = null;

    for (const log of logs) {
      const expectedHash = this.calculateHash({ actionType: log.actionType, details: log.details, userId: log.userId, schoolId: log.schoolId, createdAt: log.createdAt }, previousHash);
      if (log.hash !== expectedHash) {
        errors.push(`Log ID ${log.id} hash mismatch.`);
      }
      if (log.previousHash !== (previousHash || undefined)) {
        errors.push(`Log ID ${log.id} previous hash mismatch.`);
      }
      previousHash = log.hash;
    }

    return { isValid: errors.length === 0, errors };
  }
}
