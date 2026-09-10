
import { Entity, Column, OneToOne, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Staff } from './staff.entity';
import { SchoolClass } from './school-class.entity';
import { ClassSubjectAssignment } from './class-subject-assignment.entity';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

export enum Role {
  SuperAdmin = 'SuperAdmin', 
  Admin = 'Admin', 
  Accountant = 'Accountant',
  Teacher = 'Teacher',
  Receptionist = 'Receptionist',
  Auditor = 'Auditor',
  Parent = 'Parent',
}

@Entity('users')
@Index(['email'], { unique: true }) // Global unique email
export class User extends BaseEntity {
  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ select: false })
  password?: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ nullable: true })
  avatarUrl!: string;

  @Column({ default: 'Active' })
  status!: string;

  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true }) 
  schoolId!: string | null;

  @ManyToOne(() => School, (school) => school.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  // Changed to OneToMany to match SchoolClass ManyToOne
  @OneToMany(() => SchoolClass, (schoolClass) => schoolClass.formTeacher)
  formClasses!: SchoolClass[];
  
  @OneToMany(() => ClassSubjectAssignment, (assignment) => assignment.teacher)
  taughtSubjects!: ClassSubjectAssignment[];

  @OneToOne(() => Staff, (staff) => staff.user, { cascade: true })
  staffProfile!: Staff;
}
