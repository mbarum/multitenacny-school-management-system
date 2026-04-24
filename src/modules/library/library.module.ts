import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { Book } from './entities/book.entity';
import { Lending } from './entities/lending.entity';
import { TenancyModule } from 'src/core/tenancy/tenancy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Lending]), TenancyModule],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
