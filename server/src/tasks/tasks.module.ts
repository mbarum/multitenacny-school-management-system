
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../entities/student.entity';
import { Transaction } from '../entities/transaction.entity';
import { LibraryTransaction } from '../entities/library-transaction.entity';
import { User } from '../entities/user.entity';
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Transaction, LibraryTransaction, User]),
    CommunicationsModule, 
  ],
  providers: [TasksService],
})
export class TasksModule {}
