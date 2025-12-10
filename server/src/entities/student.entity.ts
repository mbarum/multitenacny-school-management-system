
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { SchoolClass } from './school-class.entity';
import { Transaction } from './transaction.entity';
import { School } from './school.entity';

export enum StudentStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Graduated = 'Graduated',
}

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.students, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classId' })
  schoolClass!: SchoolClass;

  @OneToMany(() => Transaction, (transaction) => transaction.student)
  transactions!: Transaction[];

  // Virtual field for query results, not stored in DB column
  balance?: number;
}
