
import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum GradingSystem {
    Traditional = 'Traditional',
    CBC = 'CBC'
}

@Entity('school_settings')
export class SchoolSetting extends BaseEntity {
  @Column()
  name!: string;

  @Column()
  address!: string;

  @Column()
  phone!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ default: 'SCH' })
  schoolCode!: string;

  @Column({ type: 'enum', enum: GradingSystem })
  gradingSystem!: GradingSystem;
}
