import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { Staff } from './staff.entity';
import { SchoolClass } from './school-class.entity';
import { ClassSubjectAssignment } from './class-subject-assignment.entity';

export const Role = {
  Admin: 'Admin',
  Accountant: 'Accountant',
  Teacher: 'Teacher',
  Receptionist: 'Receptionist',
  Auditor: 'Auditor',
  Parent: 'Parent',
} as const;
export type Role = typeof Role[keyof typeof Role];

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

  @Column()
  avatarUrl!: string;

  @Column()
  status!: string; // "Active" or "Disabled"

  @OneToOne(() => SchoolClass, (schoolClass) => schoolClass.formTeacher, { nullable: true })
  formClass!: SchoolClass | null;
  
  @OneToMany(() => ClassSubjectAssignment, (assignment) => assignment.teacher)
  taughtSubjects!: ClassSubjectAssignment[];

  @OneToOne(() => Staff, (staff) => staff.user, { cascade: true })
  staffProfile!: Staff;
}
