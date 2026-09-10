
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { School } from './school.entity';

export const EventCategory = {
  Holiday: 'Holiday',
  Academic: 'Academic',
  Meeting: 'Meeting',
  Sports: 'Sports',
  General: 'General',
} as const;
export type EventCategory = typeof EventCategory[keyof typeof EventCategory];

@Entity()
export class SchoolEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({ type: 'enum', enum: EventCategory })
  category!: EventCategory;
}
