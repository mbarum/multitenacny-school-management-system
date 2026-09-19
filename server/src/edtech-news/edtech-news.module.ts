import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EdTechArticle } from '../entities/edtech-article.entity';
import { EdTechNewsService } from './edtech-news.service';
import { EdTechNewsController } from './edtech-news.controller';
import { SuperAdminEdTechNewsController } from './super-admin-edtech-news.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EdTechArticle])],
  controllers: [EdTechNewsController, SuperAdminEdTechNewsController],
  providers: [EdTechNewsService],
  exports: [EdTechNewsService],
})
export class EdTechNewsModule {}
