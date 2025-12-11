
import type {} from 'multer';
import 'express';

import { Controller, Get, Put, Body, Post, UseInterceptors, UploadedFile, BadRequestException, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join, resolve } from 'path';
import { SettingsService } from './settings.service';
import { UpdateSchoolInfoDto } from './dto/update-school-info.dto';
import { UpdateDarajaSettingsDto } from './dto/update-daraja-settings.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';
import { Public } from '../auth/public.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public/school-info')
  getPublicSchoolInfo() {
    return this.settingsService.getPublicSchoolInfo();
  }

  @Post('upload-logo')
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('logo', {
    storage: diskStorage({
      destination: join(resolve('.'), 'public', 'uploads'),
      filename: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
        const randomName = Array(16).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
  }))
  async uploadLogo(@UploadedFile() file: any, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('File upload failed.');
    }
    const logoUrl = `/public/uploads/${file.filename}`;
    await this.settingsService.updateSchoolInfo(req.user.schoolId, { logoUrl });
    return { logoUrl };
  }

  @Get('school-info')
  getSchoolInfo(@Request() req: any) {
    return this.settingsService.getSchoolInfo(req.user.schoolId);
  }
  
  @Roles(Role.Admin)
  @Put('school-info')
  updateSchoolInfo(@Request() req: any, @Body() schoolInfo: UpdateSchoolInfoDto) {
    return this.settingsService.updateSchoolInfo(req.user.schoolId, schoolInfo);
  }

  @Roles(Role.Admin)
  @Get('daraja')
  getDarajaSettings(@Request() req: any) {
    return this.settingsService.getDarajaSettings(req.user.schoolId);
  }

  @Roles(Role.Admin)
  @Put('daraja')
  updateDarajaSettings(@Request() req: any, @Body() darajaSettings: UpdateDarajaSettingsDto) {
    return this.settingsService.updateDarajaSettings(req.user.schoolId, darajaSettings);
  }
}
