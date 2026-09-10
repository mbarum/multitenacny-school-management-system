
import { Entity, Column, OneToOne, JoinColumn, OneToMany, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity';
import { Payroll } from './payroll.entity';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

@Entity('staff')
export class Staff extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, (school) => school.staff, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column({ type: 'uuid', unique: true, nullable: true })
  userId!: string;
  
  @OneToOne(() => User, (user) => user.staffProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  name!: string;

  @Column()
  role!: string;

  @Column({ nullable: true })
  photoUrl!: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0, transformer: new ColumnNumericTransformer() })
  salary!: number;

  @Column({ type: 'date' })
  joinDate!: string;

  @Column({ nullable: true })
  bankName!: string;

  @Column({ nullable: true })
  accountNumber!: string;

  @Column({ nullable: true })
  kraPin!: string;

  @Column({ nullable: true })
  nssfNumber!: string;

  @Column({ nullable: true })
  shaNumber!: string;
  
  @OneToMany(() => Payroll, (payroll) => payroll.staff)
  payrolls!: Payroll[];
}
