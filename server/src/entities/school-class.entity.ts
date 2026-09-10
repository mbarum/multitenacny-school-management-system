
import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { User } from './user.entity';
import { Student } from './student.entity';
import { ClassFee } from './class-fee.entity';
import { School } from './school.entity';
import { BaseEntity } from './base.entity';

@Entity('school_classes')
export class SchoolClass extends BaseEntity {
  @Index()
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId!: string;

  @ManyToOne(() => School, (school) => school.classes, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school!: School;

  @Column()
  name!: string;

  @Column()
  classCode!: string;

  @Column({ type: 'uuid', nullable: true })
  formTeacherId!: string | null;

  // Changed from OneToOne to ManyToOne to allow one teacher to manage multiple classes if needed
  @ManyToOne(() => User, (user) => user.formClasses, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'formTeacherId' })
  formTeacher!: User | null;
  
  @OneToMany(() => Student, (student) => student.schoolClass)
  students!: Student[];

  @OneToMany(() => ClassFee, (classFee) => classFee.schoolClass)
  classFees!: ClassFee[];
}
