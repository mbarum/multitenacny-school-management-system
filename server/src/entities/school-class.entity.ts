import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Student } from './student.entity';
import { ClassFee } from './class-fee.entity';

@Entity()
export class SchoolClass {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
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