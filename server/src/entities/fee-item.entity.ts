
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ClassFee } from './class-fee.entity';
import { School } from './school.entity';

@Entity()
export class FeeItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
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
