import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Student } from '../../students/entities/student.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity({ name: 'invoices' })
export class Invoice extends TenantAwareEntity {
  @Column()
  invoiceNumber: string;

  @Column()
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column()
  dueDate: Date;

  @Column()
  term: string; // e.g. "Term 1 2024"

  @Column({ default: 'unpaid' })
  status: 'paid' | 'partial' | 'unpaid' | 'void';

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];
}
