
import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '../entities/school.entity';
import { DarajaSetting } from '../entities/daraja-setting.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([School, DarajaSetting, PlatformSetting])],
  controllers: [SettingsController],
  providers: [SettingsService]
})
export class SettingsModule {}
