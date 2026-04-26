import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Course } from './course.entity';

@Entity({ name: 'assignments' })
export class Assignment extends TenantAwareEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column()
  dueDate: Date;

  @Column({ default: 100 })
  maxPoints: number;

  @Column()
  courseId: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;
}
