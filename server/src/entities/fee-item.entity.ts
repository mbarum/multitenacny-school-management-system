
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ClassFee } from './class-fee.entity';
import { School } from './school.entity';

@Entity()
export class FeeItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
