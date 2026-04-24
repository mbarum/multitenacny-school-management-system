import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Student } from 'src/modules/students/entities/student.entity';

@Entity({ name: 'fee_payments' })
export class FeePayment extends TenantAwareEntity {
  @ManyToOne(() => Student)
  student: Student;

  @Column()
  studentId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentDate: Date;

  @Column({ default: 'M-PESA' })
  method: string;

  @Column({ nullable: true })
  reference: string; // Transaction code

  @Column({ nullable: true })
  remarks: string;
}
