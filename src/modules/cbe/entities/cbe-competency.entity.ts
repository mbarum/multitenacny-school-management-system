import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Subject } from 'src/modules/academics/entities/subject.entity';

@Entity({ name: 'cbe_competencies' })
export class CbeCompetency extends TenantAwareEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Subject, { nullable: true })
  subject: Subject;

  @Column({ nullable: true })
  subjectId: string;

  @Column({ nullable: true })
  category: string; // e.g. Reading, Science, Social Skills
}
