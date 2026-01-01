
import { Entity, Column, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ClassSubjectAssignment } from './class-subject-assignment.entity';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

@Entity('subjects')
export class Subject extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  name!: string;

  @Column({ length: 10, default: 'SUB' })
  code!: string;
  
  @OneToMany(() => ClassSubjectAssignment, (assignment) => assignment.subject)
  assignments!: ClassSubjectAssignment[];
}
