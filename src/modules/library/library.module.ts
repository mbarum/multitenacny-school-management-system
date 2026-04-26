import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { Book } from './entities/book.entity';
import { BookLending } from './entities/book-lending.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book, BookLending]), TenancyModule],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
