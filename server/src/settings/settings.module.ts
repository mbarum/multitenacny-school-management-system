
import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolSetting } from '../entities/school-setting.entity';
import { DarajaSetting } from '../entities/daraja-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolSetting, DarajaSetting])],
  controllers: [SettingsController],
  providers: [SettingsService]
})
export class SettingsModule {}
