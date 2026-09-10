
import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent, DataSource } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Student } from '../entities/student.entity';
import { Transaction } from '../entities/transaction.entity';
import { FeeItem } from '../entities/fee-item.entity';
import { Staff } from '../entities/staff.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
    private readonly logger = new Logger(AuditSubscriber.name);

    constructor(dataSource: DataSource) {
        dataSource.subscribers.push(this);
    }

    // Listen to all entities (filtered inside methods)
    listenTo(): any {
        return 'all'; 
    }

    private isCriticalEntity(entity: any): boolean {
        return (
            entity instanceof Student ||
            entity instanceof Transaction ||
            entity instanceof FeeItem ||
            entity instanceof Staff
        );
    }

    async afterInsert(event: InsertEvent<any>) {
        if (!this.isCriticalEntity(event.entity)) return;

        try {
            const audit = new AuditLog();
            audit.action = 'CREATE';
            audit.resource = event.metadata.name;
            audit.entityId = event.entity.id;
            audit.newState = event.entity;
            audit.schoolId = event.entity.schoolId; // Assumption: All critical entities have schoolId
            audit.details = `Created new ${event.metadata.name}`;
            
            // Note: User ID is hard to get in Subscriber without CLS, usually handled by Controller Interceptor.
            // This subscriber focuses on DATA integrity/diffs.

            await event.manager.save(AuditLog, audit);
        } catch (e) {
            this.logger.error(`Failed to audit insert for ${event.metadata.name}`, e);
        }
    }

    async afterUpdate(event: UpdateEvent<any>) {
        if (!this.isCriticalEntity(event.entity)) return;

        try {
            // Calculate Diff
            const previousState = event.databaseEntity;
            const newState = event.entity;
            
            // Clean up internal TypeORM fields for clearer logs
            const clean = (obj: any) => {
                const copy = { ...obj };
                delete copy.updatedAt;
                return copy;
            }

            const audit = new AuditLog();
            audit.action = 'UPDATE';
            audit.resource = event.metadata.name;
            audit.entityId = event.databaseEntity.id;
            audit.previousState = clean(previousState);
            audit.newState = clean(newState);
            audit.schoolId = event.databaseEntity.schoolId;
            audit.details = `Updated fields: ${event.updatedColumns.map(c => c.propertyName).join(', ')}`;

            await event.manager.save(AuditLog, audit);
        } catch (e) {
            this.logger.error(`Failed to audit update for ${event.metadata.name}`, e);
        }
    }

    async afterRemove(event: RemoveEvent<any>) {
        if (!this.isCriticalEntity(event.databaseEntity)) return;

        try {
            const audit = new AuditLog();
            audit.action = 'DELETE';
            audit.resource = event.metadata.name;
            audit.entityId = event.databaseEntity.id;
            audit.previousState = event.databaseEntity;
            audit.schoolId = event.databaseEntity.schoolId;
            audit.details = `Deleted ${event.metadata.name}`;

            await event.manager.save(AuditLog, audit);
        } catch (e) {
            this.logger.error(`Failed to audit remove for ${event.metadata.name}`, e);
        }
    }
}
