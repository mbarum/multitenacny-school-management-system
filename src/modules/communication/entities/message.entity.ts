import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'messages' })
export class Message extends TenantAwareEntity {
  @Column()
  senderId: string;

  @Column()
  recipientId: string;

  @Column('text')
  content: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;
}
