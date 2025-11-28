
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity';
import { Payroll } from './payroll.entity';
import { School } from './school.entity';

@Entity()
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, (school) => school.staff, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column({ unique: true })
  userId!: string;
  
  @OneToOne(() => User, (user) => user.staffProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  name!: string;

  @Column()
  role!: string;

  @Column()
  photoUrl!: string;

  @Column('float')
  salary!: number;

  @Column({ type: 'date' })
  joinDate!: string;

  @Column()
  bankName!: string;

  @Column()
  accountNumber!: string;

  @Column()
  kraPin!: string;

  @Column()
  nssfNumber!: string;

  @Column()
  shaNumber!: string;
  
  @OneToMany(() => Payroll, (payroll) => payroll.staff)
  payrolls!: Payroll[];
}
