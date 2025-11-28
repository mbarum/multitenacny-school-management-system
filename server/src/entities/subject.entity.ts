
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ClassSubjectAssignment } from './class-subject-assignment.entity';
import { School } from './school.entity';

@Entity()
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column()
  name!: string;
  
  @OneToMany(() => ClassSubjectAssignment, (assignment) => assignment.subject)
  assignments!: ClassSubjectAssignment[];
}
