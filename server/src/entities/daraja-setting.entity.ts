
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class DarajaSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: '' })
  consumerKey!: string;

  @Column({ default: '' })
  consumerSecret!: string;

  @Column({ default: '' })
  shortCode!: string;

  @Column({ default: '' })
  passkey!: string;

  @Column({ default: '' })
  paybillNumber!: string;
}
