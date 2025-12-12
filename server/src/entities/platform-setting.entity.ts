
import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ColumnNumericTransformer } from '../utils/transformers';

@Entity('platform_settings')
export class PlatformSetting extends BaseEntity {
  @Column('decimal', { precision: 12, scale: 2, default: 3000, transformer: new ColumnNumericTransformer() })
  basicMonthlyPrice!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 30000, transformer: new ColumnNumericTransformer() })
  basicAnnualPrice!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 5000, transformer: new ColumnNumericTransformer() })
  premiumMonthlyPrice!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 50000, transformer: new ColumnNumericTransformer() })
  premiumAnnualPrice!: number;
}
