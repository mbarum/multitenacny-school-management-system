import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EdTechNewsService } from './edtech-news.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@Controller('super-admin/edtech-news')
@Roles(Role.SuperAdmin)
export class SuperAdminEdTechNewsController {
  constructor(private readonly edTechNewsService: EdTechNewsService) {}

  @Get()
  async getAllArticles(
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.edTechNewsService.findAll({ category, status });
  }

  @Post()
  async createArticle(@Body() body: any) {
    return this.edTechNewsService.create(body);
  }

  @Put(':id')
  async updateArticle(@Param('id') id: string, @Body() body: any) {
    return this.edTechNewsService.update(id, body);
  }

  @Delete(':id')
  async deleteArticle(@Param('id') id: string) {
    return this.edTechNewsService.delete(id);
  }

  @Post(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    return this.edTechNewsService.toggleStatus(id);
  }

  @Post(':id/toggle-featured')
  async toggleFeatured(@Param('id') id: string) {
    return this.edTechNewsService.toggleFeatured(id);
  }
}
