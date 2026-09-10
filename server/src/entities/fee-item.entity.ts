
import { Entity, Column, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ClassFee } from './class-fee.entity';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

@Entity('fee_items')
export class FeeItem extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  name!: string;

  @Column()
  category!: string;

  @Column()
  frequency!: string; // 'Termly' | 'Annually' | 'One-Time'

  @Column()
  isOptional!: boolean;
  
  @OneToMany(() => ClassFee, (classFee) => classFee.feeItem, { cascade: true })
  classSpecificFees!: ClassFee[];
}
