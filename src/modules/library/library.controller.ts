import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LibraryService } from './library.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('books')
  @Roles(UserRole.ADMIN)
  create(@Body() createBookDto: CreateBookDto) {
    return this.libraryService.create(createBookDto);
  }

  @Get('books')
  findAll() {
    return this.libraryService.findAll();
  }

  @Get('books/:id')
  findOne(@Param('id') id: string) {
    return this.libraryService.findOne(id);
  }

  @Patch('books/:id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.libraryService.update(id, updateBookDto);
  }

  @Delete('books/:id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.libraryService.remove(id);
  }

  @Post('lend')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  lend(@Body() body: { bookId: string; studentId: string; dueDate?: string }) {
    const dueDate = body.dueDate ? new Date(body.dueDate) : undefined;
    return this.libraryService.lendBook(body.bookId, body.studentId, dueDate);
  }

  @Post('return/:id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  returnBook(@Param('id') id: string) {
    return this.libraryService.returnBook(id);
  }

  @Get('lendings/active')
  getActiveLendings() {
    return this.libraryService.getActiveLendings();
  }
}
