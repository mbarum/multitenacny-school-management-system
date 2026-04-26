import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { FeeItem } from './fee-item.entity';
import { ClassLevel } from '../../academics/entities/class-level.entity';

@Entity({ name: 'fee_structures' })
export class FeeStructure extends TenantAwareEntity {
  @Column()
  classLevelId: string;

  @ManyToOne(() => ClassLevel)
  @JoinColumn({ name: 'classLevelId' })
  classLevel: ClassLevel;

  @Column()
  feeItemId: string;

  @ManyToOne(() => FeeItem)
  @JoinColumn({ name: 'feeItemId' })
  feeItem: FeeItem;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;
}
