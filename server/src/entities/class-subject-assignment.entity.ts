
import { Entity, Column, ManyToOne, Unique } from 'typeorm';
import { SchoolClass } from './school-class.entity';
import { Subject } from './subject.entity';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity('class_subject_assignments')
@Unique(['classId', 'subjectId'])
export class ClassSubjectAssignment extends BaseEntity {
  @Column()
  classId!: string;

  @Column()
  subjectId!: string;

  @Column()
  teacherId!: string;
  
  @ManyToOne(() => SchoolClass, { onDelete: 'CASCADE' })
  class!: SchoolClass;
  
  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  subject!: Subject;
  
  @ManyToOne(() => User, (user) => user.taughtSubjects, { onDelete: 'CASCADE' })
  teacher!: User;
}
