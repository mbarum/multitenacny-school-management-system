import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'fee_items' })
export class FeeItem extends TenantAwareEntity {
  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: 'TERMLY'
  })
  frequency: string; // ONCE, MONTHLY, TERMLY, YEARLY

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  defaultAmount: number;
}
