import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'calendar_events' })
export class CalendarEvent extends TenantAwareEntity {
  @Column()
  title: string;

  @Column()
  start: Date;

  @Column()
  end: Date;

  @Column({ nullable: true })
  description: string;
}
