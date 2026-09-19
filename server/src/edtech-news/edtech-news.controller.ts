import { Controller, Get, Param, Query } from '@nestjs/common';
import { EdTechNewsService } from './edtech-news.service';
import { Public } from '../auth/public.decorator';

@Controller('edtech-news')
export class EdTechNewsController {
  constructor(private readonly edTechNewsService: EdTechNewsService) {}

  @Public()
  @Get()
  async getArticles(
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.edTechNewsService.findAll({ category, status });
  }

  @Public()
  @Get(':id')
  async getArticleById(@Param('id') id: string) {
    return this.edTechNewsService.findOne(id);
  }
}
