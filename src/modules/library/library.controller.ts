import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LibraryService } from './library.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('books')
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
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.libraryService.update(id, updateBookDto);
  }

  @Delete('books/:id')
  remove(@Param('id') id: string) {
    return this.libraryService.remove(id);
  }
}
