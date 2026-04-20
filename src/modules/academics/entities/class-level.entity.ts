import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Section } from './section.entity';
import { Staff } from 'src/modules/staff/entities/staff.entity';

@Entity('class_levels')
export class ClassLevel extends TenantAwareEntity {
  @Column()
  name: string; // e.g., "Grade 1", "Form 1"

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Section, (section) => section.classLevel)
  sections: Section[];

  @ManyToOne(() => Staff, { nullable: true })
  headTeacher: Staff;

  @Column({ nullable: true })
  headTeacherId: string;
}
