import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { SchoolClass } from './school-class.entity';
import { Subject } from './subject.entity';
import { User } from './user.entity';

@Entity()
@Unique(['classId', 'subjectId'])
export class ClassSubjectAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
