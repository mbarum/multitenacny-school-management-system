
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ClassSubjectAssignment } from './class-subject-assignment.entity';
import { School } from './school.entity';

@Entity()
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  name!: string;
  
  @OneToMany(() => ClassSubjectAssignment, (assignment) => assignment.subject)
  assignments!: ClassSubjectAssignment[];
}
