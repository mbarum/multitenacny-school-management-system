
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity';
import { Student } from './student.entity';
import { ClassFee } from './class-fee.entity';
import { School } from './school.entity';

@Entity()
export class SchoolClass {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  schoolId!: string;

  @ManyToOne(() => School, (school) => school.classes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school!: School;

  @Column()
  name!: string;

  @Column()
  classCode!: string;

  @Column({ type: 'uuid', nullable: true })
  formTeacherId!: string | null;

  @OneToOne(() => User, (user) => user.formClass, { nullable: true, onUpdate: 'NO ACTION', onDelete: 'SET NULL' })
  @JoinColumn({ name: 'formTeacherId' })
  formTeacher!: User | null;
  
  @OneToMany(() => Student, (student) => student.schoolClass)
  students!: Student[];

  @OneToMany(() => ClassFee, (classFee) => classFee.schoolClass)
  classFees!: ClassFee[];
}
