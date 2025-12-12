
import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

@Entity('grading_rules')
export class GradingRule extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  grade!: string;

  @Column('int')
  minScore!: number;

  @Column('int')
  maxScore!: number;
}
