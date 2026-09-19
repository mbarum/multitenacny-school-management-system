
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Processor('notifications', {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    super();
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const secure = port === 465; // Use SSL for 465, STARTTLS for others (like 587)

    const rejectUnauthorizedRaw = this.configService.get('SMTP_REJECT_UNAUTHORIZED');
    const rejectUnauthorized = rejectUnauthorizedRaw !== undefined
      ? String(rejectUnauthorizedRaw).toLowerCase() === 'true'
      : true;

    const tlsOptions: Record<string, any> = {
      rejectUnauthorized,
    };

    if (!rejectUnauthorized) {
      tlsOptions.checkServerIdentity = () => undefined;
    }

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port,
      secure,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: tlsOptions,
    });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'send-email':
        await this.handleSendEmail(job.data);
        break;
      case 'send-sms':
        await this.handleSendSMS(job.data);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleSendEmail(data: { to: string | string[], subject: string, html: string }) {
    try {
      const smtpFrom = this.configService.get<string>('SMTP_FROM');
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const fromAddress = smtpFrom || (smtpUser ? `"Saaslink" <${smtpUser}>` : '"Saaslink" <no-reply@saaslink.tech>');

      await this.transporter.sendMail({
        from: fromAddress,
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
      this.logger.log(`Email successfully dispatched to ${data.to} from ${fromAddress}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${data.to}: ${error.message}`, error.stack);
      throw error; // Let BullMQ retry
    }
  }

  private async handleSendSMS(data: { phone: string, message: string }) {
    // Integration with SMS Gateway would go here
    // For now, simulate delay and success
    await new Promise(resolve => setTimeout(resolve, 500));
    this.logger.log(`[SIMULATION] SMS sent to ${data.phone}: ${data.message}`);
  }
}
