
import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

@Entity('daraja_settings')
export class DarajaSetting extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @OneToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column({ default: '' })
  consumerKey!: string;

  @Column({ default: '' })
  consumerSecret!: string;

  @Column({ default: '' })
  shortCode!: string;

  @Column({ default: '' })
  passkey!: string;

  @Column({ default: '' })
  paybillNumber!: string;

  @Column({ default: 'sandbox' })
  environment!: 'sandbox' | 'production';
}
