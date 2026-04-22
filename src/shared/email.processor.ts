import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

@Processor('emailQueue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const host =
        this.configService.get<string>('EMAIL_HOST') ||
        this.configService.get<string>('MAIL_HOST');
      const portStr =
        this.configService.get<string>('EMAIL_PORT') ||
        this.configService.get<string>('MAIL_PORT') ||
        '587';
      const port = parseInt(portStr, 10);

      const secureStr =
        this.configService.get<string>('EMAIL_SECURE') ||
        this.configService.get<string>('MAIL_ENCRYPTION');
      const secure =
        secureStr === 'true' || secureStr === 'ssl' || secureStr === 'tls';

      const user =
        this.configService.get<string>('EMAIL_USER') ||
        this.configService.get<string>('MAIL_USERNAME');
      const pass =
        this.configService.get<string>('EMAIL_PASS') ||
        this.configService.get<string>('MAIL_PASSWORD');

      const rejectUnauthorizedStr =
        this.configService.get<string>('EMAIL_REJECT_UNAUTHORIZED') ||
        this.configService.get<string>('MAIL_REJECT_UNAUTHORIZED');
      const rejectUnauthorized = rejectUnauthorizedStr === 'true';

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

  async process(job: Job<EmailJobData, any, string>): Promise<any> {
    const { to, subject, html } = job.data;
    
    const host =
      this.configService.get<string>('EMAIL_HOST') ||
      this.configService.get<string>('MAIL_HOST');
      
    if (!host) {
      this.logger.warn(`EMAIL_HOST is not configured. Mocking async email to ${to} via job ${job.id}.`);
      this.logger.log(
        `[MOCK EMAIL QUEUED] To: ${to}, Subject: ${subject}, Body: ${html}`,
      );
      return;
    }

    let from =
      this.configService.get<string>('EMAIL_FROM') ||
      this.configService.get<string>('MAIL_FROM_ADDRESS') ||
      this.configService.get<string>('EMAIL_USER') ||
      'emis@saaslink.tech';

    // Aggressive override if it contains placeholders
    if (from.includes('yourdomain.com') || from.includes('saaslink.test') || from === 'noreply@example.com') {
      from = 'emis@saaslink.tech';
    }

    try {
      await this.getTransporter().sendMail({
        from,
        to,
        subject,
        html,
      });
      this.logger.log(`Async email successfully sent to ${to} with subject: ${subject}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send async email to ${to}: ${errorMessage}`);
      throw error; // Will be picked up by BullMQ for retries
    }
  }
}
