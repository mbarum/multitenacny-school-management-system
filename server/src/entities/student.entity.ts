
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { SchoolClass } from './school-class.entity';
import { Transaction } from './transaction.entity';

export const StudentStatus = {
  Active: 'Active',
  Inactive: 'Inactive',
  Graduated: 'Graduated',
} as const;
export type StudentStatus = typeof StudentStatus[keyof typeof StudentStatus];

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  admissionNumber!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.Active })
  status!: StudentStatus;

  @Column()
  profileImage!: string;

  @Column()
  guardianName!: string;

  @Column()
  guardianContact!: string;

  @Column()
  guardianAddress!: string;

  @Column()
  guardianEmail!: string;

  @Column()
  emergencyContact!: string;

  @Column({ type: 'date' })
  dateOfBirth!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  schoolClass!: SchoolClass;

  @OneToMany(() => Transaction, (transaction) => transaction.student)
  transactions!: Transaction[];

  // Virtual field for query results, not stored in DB column
  balance?: number;
}
