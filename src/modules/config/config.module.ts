import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigController } from './config.controller';
import { SystemConfig } from './entities/system-config.entity';
import { SystemConfigService } from './system-config.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig])],
  controllers: [ConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class AppConfigModule {}
