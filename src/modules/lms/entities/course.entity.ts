import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { ClassLevel } from '../../academics/entities/class-level.entity';
import { Staff } from '../../staff/entities/staff.entity';

@Entity({ name: 'courses' })
export class Course extends TenantAwareEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column()
  classLevelId: string;

  @ManyToOne(() => ClassLevel)
  @JoinColumn({ name: 'classLevelId' })
  classLevel: ClassLevel;

  @Column({ nullable: true })
  teacherId: string;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: 'teacherId' })
  teacher: Staff;

  @Column({ default: true })
  isPublished: boolean;
}
