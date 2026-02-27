import { Entity, Column, Index } from 'typeorm';
import { TenantAwareEntity } from 'src/core/tenancy/tenant-aware.entity';

export enum LmsProviderType {
  MOODLE = 'moodle',
  GOOGLE_CLASSROOM = 'google_classroom',
  CANVAS = 'canvas',
}

/**
 * @description Represents the connection configuration for a specific Learning Management System (LMS)
 * instance for a single tenant. This allows each school to connect their own unique LMS.
 */
@Entity({ name: 'lms_connections' })
@Index(['tenantId', 'provider'], { unique: true })
export class LmsConnection extends TenantAwareEntity {
  @Column({ type: 'enum', enum: LmsProviderType })
  provider: LmsProviderType;

  @Column()
  apiUrl: string;

  /**
   * @description Stores the primary credential (e.g., API key, OAuth client ID) encrypted.
   */
  @Column({ name: 'encrypted_credential_1' })
  encryptedCredential1: string;

  /**
   * @description Stores an optional secondary credential (e.g., OAuth client secret) encrypted.
   */
  @Column({ name: 'encrypted_credential_2', nullable: true })
  encryptedCredential2: string;

  /**
   * @description Stores an optional OAuth refresh token, allowing for re-authentication without user intervention.
   */
  @Column({ name: 'encrypted_refresh_token', nullable: true })
  encryptedRefreshToken: string;

  @Column({ default: false })
  isConnected: boolean;
}
