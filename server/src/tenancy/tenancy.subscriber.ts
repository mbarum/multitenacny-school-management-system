
import { EventSubscriber, EntitySubscriberInterface, InsertEvent, DataSource } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { getSchoolIdFromContext } from './tenancy.context';

@Injectable()
@EventSubscriber()
export class TenancySubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(TenancySubscriber.name);

  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  // Listen to all entities
  listenTo() {
    return 'all';
  }

  async beforeInsert(event: InsertEvent<any>) {
    const schoolId = getSchoolIdFromContext();
    
    // If we are in a tenant context
    if (schoolId) {
        const entity = event.entity;
        const metadata = event.metadata;

        // Check if entity has a schoolId column
        const hasSchoolIdColumn = metadata.columns.some(col => col.propertyName === 'schoolId');

        if (hasSchoolIdColumn) {
            // Governance: Ensure schoolId matches the context
            // If developer forgot to set it, we set it automatically.
            if (!entity.schoolId) {
                entity.schoolId = schoolId;
                // this.logger.debug(`[Tenancy] Auto-injected schoolId for ${metadata.name}`);
            } else if (entity.schoolId !== schoolId) {
                // Critical: Prevent cross-tenant writes
                this.logger.warn(`[Security] Blocked attempt to write data for school ${entity.schoolId} while in context of ${schoolId}`);
                throw new Error('Cross-tenant write access denied.');
            }
        }
    }
  }
}
