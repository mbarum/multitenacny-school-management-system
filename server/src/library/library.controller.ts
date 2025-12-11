
import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { LibraryService } from './library.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../entities/user.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { IssueBookDto } from './dto/issue-book.dto';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('books')
  findAllBooks(@Request() req: any) {
    return this.libraryService.findAllBooks(req.user.schoolId);
  }

  @Post('books')
  @Roles(Role.Admin, Role.Teacher) // Librarian role mapped to Teacher for now
  createBook(@Request() req: any, @Body() dto: CreateBookDto) {
    return this.libraryService.createBook(dto, req.user.schoolId);
  }

  @Patch('books/:id')
  @Roles(Role.Admin, Role.Teacher)
  updateBook(@Request() req: any, @Param('id') id: string, @Body() updates: any) {
    return this.libraryService.updateBook(id, updates, req.user.schoolId);
  }

  @Delete('books/:id')
  @Roles(Role.Admin)
  deleteBook(@Request() req: any, @Param('id') id: string) {
    return this.libraryService.deleteBook(id, req.user.schoolId);
  }

  @Post('issue')
  @Roles(Role.Admin, Role.Teacher)
  issueBook(@Request() req: any, @Body() dto: IssueBookDto) {
    return this.libraryService.issueBook(dto, req.user.schoolId);
  }

  @Post('return/:id')
  @Roles(Role.Admin, Role.Teacher)
  returnBook(@Request() req: any, @Param('id') id: string) {
    return this.libraryService.returnBook(id, req.user.schoolId);
  }

  @Get('transactions')
  getTransactions(@Request() req: any) {
    return this.libraryService.getTransactions(req.user.schoolId);
  }
}
