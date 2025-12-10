
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Student } from '../entities/student.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { LibraryTransaction, LibraryStatus } from '../entities/library-transaction.entity';
import { CommunicationsService } from '../communications/communications.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(LibraryTransaction) private libTransRepo: Repository<LibraryTransaction>,
    private communicationsService: CommunicationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkLibraryOverdue() {
    this.logger.log('Running automated check for overdue library books...');
    const today = new Date().toISOString().split('T')[0];
    
    // Find books due today or earlier that are not returned
    const overdueTransactions = await this.libTransRepo.find({
        where: { 
            status: LibraryStatus.BORROWED,
            dueDate: LessThan(today)
        },
        relations: ['student', 'book', 'school']
    });

    for (const trans of overdueTransactions) {
        if (trans.student && trans.student.guardianContact) {
            const message = `Reminder: The book "${trans.book.title}" borrowed by ${trans.student.name} was due on ${trans.dueDate}. Please return it to the library.`;
            // In a real system, send SMS
            this.logger.log(`[SMS Simulation] To: ${trans.student.guardianContact}, Msg: ${message}`);
            
            // Mark as Overdue in DB
            trans.status = LibraryStatus.OVERDUE;
            await this.libTransRepo.save(trans);
        }
    }
  }

  // Use standard Cron string for "Every Monday at 9:00 AM" instead of invalid constant
  @Cron('0 9 * * 1')
  async generateFeeReminders() {
    this.logger.log('Running automated fee reminder generation...');
    // This is a heavy operation, simplified here.
    // In production, use Batches or Queues.
    
    const students = await this.studentRepo.find({ relations: ['school'] });
    
    for (const student of students) {
        const balance = await this.calculateBalance(student.id);
        if (balance > 1000) { // Threshold for reminder
             const message = `Dear Parent, outstanding fee balance for ${student.name} is KES ${balance.toLocaleString()}. Please pay via M-Pesa.`;
             this.logger.log(`[SMS Simulation] To: ${student.guardianContact}, Msg: ${message}`);
        }
    }
  }

  private async calculateBalance(studentId: string): Promise<number> {
      const result = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(CASE WHEN t.type IN (:...debits) THEN t.amount ELSE -t.amount END)', 'balance')
      .where('t.studentId = :studentId', { studentId })
      .setParameters({ debits: [TransactionType.Invoice, TransactionType.ManualDebit] })
      .getRawOne();
      return parseFloat(result.balance) || 0;
  }
}
