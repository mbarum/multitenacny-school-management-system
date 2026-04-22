import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'system_config' })
export class SystemConfig {
  @PrimaryColumn()
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;
}
