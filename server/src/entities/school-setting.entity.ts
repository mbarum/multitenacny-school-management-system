import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum GradingSystem {
    Traditional = 'Traditional',
    CBC = 'CBC'
}

@Entity()
export class SchoolSetting {
  @PrimaryGeneratedColumn()
  id!: number;

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