
import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { Subscription } from './subscription.entity';
import { Student } from './student.entity';
import { Staff } from './staff.entity';
import { SchoolClass } from './school-class.entity';
import { BaseEntity } from './base.entity';

export enum GradingSystem {
    Traditional = 'Traditional',
    CBC = 'CBC'
}

@Entity('schools')
export class School extends BaseEntity {
  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string; // Unique identifier for URLs (e.g., green-hills.saaslink.com)

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ default: 'SCH' })
  schoolCode!: string;

  @Column({ default: 'KES' })
  currency!: string;

  @Column({ type: 'enum', enum: GradingSystem, default: GradingSystem.Traditional })
  gradingSystem!: GradingSystem;

  @OneToMany(() => User, (user) => user.school)
  users!: User[];

  @OneToMany(() => Student, (student) => student.school)
  students!: Student[];
  
  @OneToMany(() => Staff, (staff) => staff.school)
  staff!: Staff[];

  @OneToMany(() => SchoolClass, (schoolClass) => schoolClass.school)
  classes!: SchoolClass[];

  @OneToOne(() => Subscription, (subscription) => subscription.school, { cascade: true })
  subscription!: Subscription;
}
