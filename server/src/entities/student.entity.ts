
import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { SchoolClass } from './school-class.entity';
import { Transaction } from './transaction.entity';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

export enum StudentStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Graduated = 'Graduated',
}

@Entity('students')
@Index(['schoolId', 'admissionNumber'], { unique: true }) // Ensure unique admission per school
@Index(['schoolId', 'name']) // Optimize search
@Index(['schoolId', 'status']) // Optimize filtering active students
export class Student extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, (school) => school.students, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column() 
  admissionNumber!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.Active })
  status!: StudentStatus;

  @Column({ nullable: true })
  profileImage!: string;

  @Column()
  guardianName!: string;

  @Index() // Optimize phone lookups for M-Pesa
  @Column()
  guardianContact!: string;

  @Column()
  guardianAddress!: string;

  @Column({ nullable: true })
  guardianEmail!: string;

  @Column({ nullable: true })
  emergencyContact!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: string;

  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.students, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classId' })
  schoolClass!: SchoolClass;

  @OneToMany(() => Transaction, (transaction) => transaction.student)
  transactions!: Transaction[];

  // Virtual field
  balance?: number;
}
