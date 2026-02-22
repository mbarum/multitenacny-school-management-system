import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditTrailEntities } from './entities';
import { AuditTrailService } from './audit-trail.service';
import { AuditTrailController } from './audit-trail.controller';

@Module({
  imports: [TypeOrmModule.forFeature(AuditTrailEntities)],
  providers: [AuditTrailService],
  controllers: [AuditTrailController],
  exports: [AuditTrailService],
})
export class AuditTrailModule {}
