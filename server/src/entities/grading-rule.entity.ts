import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class GradingRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  grade!: string;

  @Column('int')
  minScore!: number;

  @Column('int')
  maxScore!: number;
}
