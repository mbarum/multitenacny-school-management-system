
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { Book } from '../entities/book.entity';
import { LibraryTransaction } from '../entities/library-transaction.entity';
import { Student } from '../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, LibraryTransaction, Student])],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
