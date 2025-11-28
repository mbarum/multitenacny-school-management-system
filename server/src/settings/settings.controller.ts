
import type {} from 'multer';
import 'express';

import { Controller, Get, Put, Body, UseGuards, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join, resolve } from 'path';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { UpdateSchoolInfoDto } from './dto/update-school-info.dto';
import { UpdateDarajaSettingsDto } from './dto/update-daraja-settings.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('upload-logo')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('logo', {
    storage: diskStorage({
      // Use resolve('.') for reliable root path resolution in standard Node/Docker envs
      destination: join(resolve('.'), 'public', 'uploads'),
      filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
        const randomName = Array(16).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req: Request, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
  }))
  async uploadLogo(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('File upload failed.');
    }
    const logoUrl = `/public/uploads/${file.filename}`;
    await this.settingsService.updateSchoolInfo({ logoUrl });
    return { logoUrl };
  }

  @Get('school-info')
  getSchoolInfo() {
    return this.settingsService.getSchoolInfo();
  }
  
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  @Put('school-info')
  updateSchoolInfo(@Body() schoolInfo: UpdateSchoolInfoDto) {
    return this.settingsService.updateSchoolInfo(schoolInfo);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  @Get('daraja')
  getDarajaSettings() {
    return this.settingsService.getDarajaSettings();
  }

  @UseGuards(JwtAuthGuard)
  @Roles(Role.Admin)
  @Put('daraja')
  updateDarajaSettings(@Body() darajaSettings: UpdateDarajaSettingsDto) {
    return this.settingsService.updateDarajaSettings(darajaSettings);
  }

}