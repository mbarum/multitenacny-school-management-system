import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * @description A shared service for encrypting and decrypting sensitive data.
 * This is a critical security component to ensure credentials are not stored in plain text.
 * It uses AES-256-CBC, a strong symmetric encryption algorithm.
 * The encryption key is read from the environment variables.
 */
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const secret = this.configService.get<string>('ENCRYPTION_KEY') || '12345678901234567890123456789012';
    if (!secret || secret.length !== 32) {
      throw new Error('ENCRYPTION_KEY environment variable must be a 32-character string.');
    }
    this.key = Buffer.from(secret, 'utf-8');
  }

  /**
   * @description Encrypts a plain text string.
   * It generates a unique Initialization Vector (IV) for each encryption operation,
   * which is a security best practice, and prepends it to the encrypted text.
   * @param text The plain text to encrypt.
   * @returns A string containing the IV and the encrypted text, separated by a colon.
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * @description Decrypts a string that was encrypted with the encrypt method.
   * It extracts the IV from the input string to perform the decryption.
   * @param encryptedText The encrypted text (IV and ciphertext, separated by a colon).
   * @returns The decrypted plain text string.
   */
  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift() || '', 'hex');
    const encrypted = parts.join(':');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}