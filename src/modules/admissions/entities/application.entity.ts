import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('applications')
export class Application extends TenantAwareEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column()
  gender: string;

  @Column({ nullable: true })
  appliedClassId: string;

  @Column({ nullable: true })
  academicYearId: string;

  // Parent Details
  @Column()
  parentFirstName: string;

  @Column()
  parentLastName: string;

  @Column()
  parentEmail: string;

  @Column()
  parentPhone: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ type: 'simple-json', nullable: true })
  documents: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
