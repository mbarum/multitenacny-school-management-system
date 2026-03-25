import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const host = this.configService.get<string>('EMAIL_HOST') || this.configService.get<string>('MAIL_HOST');
      const portStr = this.configService.get<string>('EMAIL_PORT') || this.configService.get<string>('MAIL_PORT') || '587';
      const port = parseInt(portStr, 10);
      
      const secureStr = this.configService.get<string>('EMAIL_SECURE') || this.configService.get<string>('MAIL_ENCRYPTION');
      const secure = secureStr === 'true' || secureStr === 'ssl' || secureStr === 'tls';
      
      const user = this.configService.get<string>('EMAIL_USER') || this.configService.get<string>('MAIL_USERNAME');
      const pass = this.configService.get<string>('EMAIL_PASS') || this.configService.get<string>('MAIL_PASSWORD');
      
      const rejectUnauthorizedStr = this.configService.get<string>('EMAIL_REJECT_UNAUTHORIZED') || this.configService.get<string>('MAIL_REJECT_UNAUTHORIZED');
      // Default to false for self-signed certs if not explicitly set to true
      const rejectUnauthorized = rejectUnauthorizedStr === 'true';

      if (!host) {
        this.logger.warn(
          'EMAIL_HOST or MAIL_HOST is not defined. Email service may not work correctly.',
        );
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth:
          user && pass
            ? {
                user,
                pass,
              }
            : undefined,
        tls: {
          rejectUnauthorized,
        },
      });
    }
    return this.transporter;
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const from = this.configService.get<string>('EMAIL_FROM') || this.configService.get<string>('MAIL_FROM_ADDRESS') || 'noreply@example.com';

    const host = this.configService.get<string>('EMAIL_HOST') || this.configService.get<string>('MAIL_HOST');
    if (!host) {
      this.logger.warn(`EMAIL_HOST is not configured. Mocking email to ${to}.`);
      this.logger.log(`[MOCK EMAIL] Password reset link: ${resetLink}`);
      return;
    }

    try {
      await this.getTransporter().sendMail({
        from,
        to,
        subject: 'Your Password Reset Request',
        html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, please ignore this email.</p>`,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send password reset email to ${to}: ${errorMessage}`,
      );
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const from = this.configService.get<string>('EMAIL_FROM') || this.configService.get<string>('MAIL_FROM_ADDRESS') || 'noreply@example.com';

    const host = this.configService.get<string>('EMAIL_HOST') || this.configService.get<string>('MAIL_HOST');
    if (!host) {
      this.logger.warn(`EMAIL_HOST is not configured. Mocking email to ${to}.`);
      this.logger.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Body: ${html}`);
      return;
    }

    try {
      await this.getTransporter().sendMail({
        from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} with subject: ${subject}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send email to ${to}: ${errorMessage}`,
      );
      throw error;
    }
  }
}
