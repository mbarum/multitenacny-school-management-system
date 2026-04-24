import { Entity, Column } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'books' })
export class Book extends TenantAwareEntity {
  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ nullable: true })
  isbn: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: 1 })
  availableQuantity: number;

  @Column({ default: 'available' })
  status: 'available' | 'borrowed';
}
