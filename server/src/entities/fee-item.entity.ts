import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ClassFee } from './class-fee.entity';

@Entity()
export class FeeItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
