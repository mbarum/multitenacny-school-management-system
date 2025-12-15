
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
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
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM', '"Saaslink" <no-reply@saaslink.com>'),
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
      this.logger.log(`Email sent to ${data.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.to}`, error);
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
