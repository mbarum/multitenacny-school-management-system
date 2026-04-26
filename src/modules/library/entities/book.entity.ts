import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

@Entity({ name: 'books' })
export class Book extends TenantAwareEntity {
  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ nullable: true })
  isbn: string;

  @Column()
  category: string;

  @Column({ default: 1 })
  totalCopies: number;

  @Column({ default: 1 })
  availableCopies: number;

  @Column({ nullable: true })
  location: string; // e.g. "Shelf A-1"
}
