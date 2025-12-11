
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { School } from './school.entity';

@Entity()
export class DarajaSetting {
  @PrimaryGeneratedColumn()
  id!: number;

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
}
