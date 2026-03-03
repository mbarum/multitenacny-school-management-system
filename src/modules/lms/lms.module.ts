import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { LmsConnection } from './entities/lms-connection.entity';
import { SharedModule } from 'src/shared/shared.module';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LmsConnection]),
    TenancyModule,
    SharedModule,
  ],
  controllers: [LmsController],
  providers: [LmsService],
})
export class LmsModule {}
