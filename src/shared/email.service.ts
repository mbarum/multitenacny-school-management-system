import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailJobData } from './email.processor';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('emailQueue') private readonly emailQueue: Queue<EmailJobData>,
  ) {}

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('APP_URL') ||
      'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    await this.emailQueue.add('sendEmail', {
      to,
      subject: 'Your Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, please ignore this email.</p>`,
    });
    this.logger.log(`Password reset email queued for ${to}`);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.emailQueue.add('sendEmail', {
      to,
      subject,
      html,
    });
    this.logger.log(`Email queued for ${to} with subject: ${subject}`);
  }
}
