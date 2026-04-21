import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportProcessor } from './processors/report.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reports',
    }),
  ],
  providers: [ReportProcessor],
  exports: [BullModule],
})
export class JobsModule {}
