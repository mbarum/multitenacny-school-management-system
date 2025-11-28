
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Staff } from './staff.entity';
import { SchoolClass } from './school-class.entity';
import { ClassSubjectAssignment } from './class-subject-assignment.entity';
import { School } from './school.entity';

export enum Role {
  SuperAdmin = 'SuperAdmin', // Platform owner
  Admin = 'Admin', // School Admin
  Accountant = 'Accountant',
  Teacher = 'Teacher',
  Receptionist = 'Receptionist',
  Auditor = 'Auditor',
  Parent = 'Parent',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false }) // Hide password by default on selects
  password?: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ nullable: true })
  avatarUrl!: string;

  @Column({ default: 'Active' })
  status!: string; // "Active" or "Disabled"

  // Multi-Tenancy Link
  @Index()
  @Column({ type: 'uuid', nullable: true }) 
  schoolId!: string | null; // Nullable only for SuperAdmin

  @ManyToOne(() => School, (school) => school.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @OneToOne(() => SchoolClass, (schoolClass) => schoolClass.formTeacher, { nullable: true })
  formClass!: SchoolClass | null;
  
  @OneToMany(() => ClassSubjectAssignment, (assignment) => assignment.teacher)
  taughtSubjects!: ClassSubjectAssignment[];

  @OneToOne(() => Staff, (staff) => staff.user, { cascade: true })
  staffProfile!: Staff;
}
