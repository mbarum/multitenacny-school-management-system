import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'report_cards' })
export class ReportCard extends TenantAwareEntity {
  @Column()
  studentId: string;

  @Column()
  examinationId: string;

  @Column('decimal', { precision: 5, scale: 2 })
  marks: number;

  @Column({ nullable: true })
  grade: string;

  @Column({ nullable: true })
  remarks: string;
}
