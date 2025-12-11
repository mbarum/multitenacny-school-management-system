
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PlatformSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('float', { default: 3000 })
  basicMonthlyPrice!: number;

  @Column('float', { default: 30000 })
  basicAnnualPrice!: number;

  @Column('float', { default: 5000 })
  premiumMonthlyPrice!: number;

  @Column('float', { default: 50000 })
  premiumAnnualPrice!: number;
}
