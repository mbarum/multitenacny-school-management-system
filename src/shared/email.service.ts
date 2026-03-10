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
      const host = this.configService.get<string>('EMAIL_HOST');
      const port = parseInt(
        this.configService.get<string>('EMAIL_PORT') || '587',
        10,
      );
      const secure = this.configService.get<string>('EMAIL_SECURE') === 'true';
      const user = this.configService.get<string>('EMAIL_USER');
      const pass = this.configService.get<string>('EMAIL_PASS');
      const rejectUnauthorized =
        this.configService.get<string>('EMAIL_REJECT_UNAUTHORIZED') !== 'false';

      if (!host) {
        this.logger.warn(
          'EMAIL_HOST is not defined. Email service may not work correctly.',
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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const from = this.configService.get<string>('EMAIL_FROM');

    try {
      await this.getTransporter().sendMail({
        from,
        to,
        subject: 'Your Password Reset Request',
        html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, please ignore this email.</p>`,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send password reset email to ${to}: ${errorMessage}`,
      );
      throw error;
    }
  }
}
