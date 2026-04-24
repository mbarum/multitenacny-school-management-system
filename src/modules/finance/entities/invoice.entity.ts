import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Student } from '../../students/entities/student.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @ManyToOne(() => Student)
  student: Student;

  @Column()
  studentId: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  paidAmount: number;

  @Column()
  dueDate: Date;

  @Column({ default: 'unpaid' }) // unpaid, partial, paid, void
  status: string;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items)
  invoice: Invoice;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: number;
}
