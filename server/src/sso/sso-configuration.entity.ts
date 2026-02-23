import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { School } from '../entities/school.entity';

export enum SsoProvider {
  Google = 'Google',
  AzureAD = 'AzureAD',
  Okta = 'Okta',
}

@Entity('sso_configurations')
export class SsoConfiguration extends BaseEntity {
  @Column({ type: 'enum', enum: SsoProvider })
  provider!: SsoProvider;

  @Column()
  clientId!: string;

  @Column()
  clientSecret!: string;

  @Column()
  issuerUrl!: string;

  @ManyToOne(() => School, (school) => school.ssoConfigurations)
  school!: School;
}
