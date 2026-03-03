import { Entity, Column, ManyToOne } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';
import { ClassLevel } from './class-level.entity';

@Entity('sections')
export class Section extends TenantAwareEntity {
  @Column()
  name: string; // e.g., "A", "B", "Blue", "Green"

  @ManyToOne(() => ClassLevel, (classLevel) => classLevel.sections)
  classLevel: ClassLevel;

  @Column()
  classLevelId: string;

  @Column({ nullable: true })
  room: string;
}
