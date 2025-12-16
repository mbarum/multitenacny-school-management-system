
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { BackupService } from './backup.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../entities/student.entity';
import { Transaction } from '../entities/transaction.entity';
import { LibraryTransaction } from '../entities/library-transaction.entity';
import { User } from '../entities/user.entity';
import { CommunicationsModule } from '../communications/communications.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Transaction, LibraryTransaction, User]),
    CommunicationsModule, 
    ConfigModule,
  ],
  providers: [TasksService, BackupService],
})
export class TasksModule {}
