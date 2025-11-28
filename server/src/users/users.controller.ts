
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join, resolve } from 'path';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.Admin)
  create(@Request() req: any, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto, req.user.schoolId);
  }

  @Get()
  @Roles(Role.Admin)
  findAll(@Request() req: any) {
    return this.usersService.findAll(req.user.schoolId);
  }

  @Get('me')
  getProfile(@Request() req: any) {
    return this.usersService.findOne(req.user.userId, req.user.schoolId);
  }

  @Patch('profile')
  updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto, req.user.schoolId);
  }

  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file', {
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
  async uploadAvatar(@UploadedFile() file: any, @Request() req: any) {
    if (!file) throw new BadRequestException('File upload failed.');
    const avatarUrl = `/public/uploads/${file.filename}`;
    await this.usersService.update(req.user.userId, { ...req.user, avatarUrl } as any, req.user.schoolId);
    return { avatarUrl };
  }

  @Get(':id')
  @Roles(Role.Admin)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.usersService.findOne(id, req.user.schoolId);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(@Request() req: any, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto, req.user.schoolId);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.usersService.remove(id, req.user.schoolId);
  }
}
