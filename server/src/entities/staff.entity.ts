import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Payroll } from './payroll.entity';

@Entity()
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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