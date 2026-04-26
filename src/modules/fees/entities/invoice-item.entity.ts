import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { Invoice } from './invoice.entity';

@Entity({ name: 'invoice_items' })
export class InvoiceItem extends TenantAwareEntity {
  @Column()
  invoiceId: string;

  @ManyToOne(() => Invoice, (inv) => inv.items)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;
}
