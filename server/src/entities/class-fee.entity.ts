import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { FeeItem } from './fee-item.entity';
import { SchoolClass } from './school-class.entity';

@Entity()
@Unique(['feeItemId', 'classId'])
export class ClassFee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  feeItemId!: string;

  @Column()
  classId!: string;

  @ManyToOne(() => FeeItem, (feeItem) => feeItem.classSpecificFees, { onDelete: 'CASCADE' })
  feeItem!: FeeItem;
  
  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.classFees, { onDelete: 'CASCADE' })
  schoolClass!: SchoolClass;

  @Column('float')
  amount!: number;
}
