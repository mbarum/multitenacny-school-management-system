import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SsoConfiguration } from './sso-configuration.entity';
import { SsoService } from './sso.service';
import { SsoController } from './sso.controller';
import { AuthModule } from '../auth/auth.module';
import { SchoolModule } from '../school/school.module';

@Module({
  imports: [TypeOrmModule.forFeature([SsoConfiguration]), AuthModule, SchoolModule],
  providers: [SsoService],
  controllers: [SsoController],
})
export class SsoModule {}
