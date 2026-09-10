
import { Entity, Column, ManyToOne, Unique } from 'typeorm';
import { FeeItem } from './fee-item.entity';
import { SchoolClass } from './school-class.entity';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

@Entity('class_fees')
@Unique(['feeItemId', 'classId'])
export class ClassFee extends BaseEntity {
  @Column()
  feeItemId!: string;

  @Column()
  classId!: string;

  @ManyToOne(() => FeeItem, (feeItem) => feeItem.classSpecificFees, { onDelete: 'CASCADE' })
  feeItem!: FeeItem;
  
  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.classFees, { onDelete: 'CASCADE' })
  schoolClass!: SchoolClass;

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  amount!: number;
}
