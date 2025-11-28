import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ClassSubjectAssignment } from './class-subject-assignment.entity';

@Entity()
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;
  
  @OneToMany(() => ClassSubjectAssignment, (assignment) => assignment.subject)
  assignments!: ClassSubjectAssignment[];
}
