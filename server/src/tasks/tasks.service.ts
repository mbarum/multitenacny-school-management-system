
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Student } from '../entities/student.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { LibraryTransaction, LibraryStatus } from '../entities/library-transaction.entity';
import { User, Role } from '../entities/user.entity';
import { CommunicationsService } from '../communications/communications.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(LibraryTransaction) private libTransRepo: Repository<LibraryTransaction>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private communicationsService: CommunicationsService,
  ) {}

  // Helper to find a system sender (Admin) for a specific school
  private async getSystemSenderId(schoolId: string): Promise<string | null> {
      const admin = await this.userRepo.findOne({ where: { schoolId: schoolId as any, role: Role.Admin } });
      return admin ? admin.id : null;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkLibraryOverdue() {
    this.logger.log('Running automated check for overdue library books...');
    const today = new Date().toISOString().split('T')[0];
    
    // Find books borrowed and due before today
    const overdueTransactions = await this.libTransRepo.find({
        where: { 
            status: LibraryStatus.BORROWED,
            dueDate: LessThan(today)
        },
        relations: ['student', 'book', 'school']
    });

    for (const trans of overdueTransactions) {
        if (trans.student && trans.student.guardianContact) {
            // 1. Mark as Overdue in DB
            trans.status = LibraryStatus.OVERDUE;
            await this.libTransRepo.save(trans);

            // 2. Send SMS Notification
            const senderId = await this.getSystemSenderId(trans.schoolId);
            if (senderId) {
                const message = `Reminder: The book "${trans.book.title}" borrowed by ${trans.student.name} was due on ${trans.dueDate}. Please return it to the library.`;
                await this.communicationsService.sendSMS(trans.student.guardianContact, message, trans.student.id, senderId);
            } else {
                this.logger.warn(`No admin found for school ${trans.schoolId} to send overdue SMS.`);
            }
        }
    }
  }

  // Run weekly on Monday at 9:00 AM
  @Cron('0 9 * * 1')
  async generateFeeReminders() {
    this.logger.log('Running automated fee reminder generation...');
    
    const students = await this.studentRepo.find({ 
        where: { status: 'Active' } as any,
        relations: ['school'] 
    });
    
    for (const student of students) {
        const balance = await this.calculateBalance(student.id);
        // Configurable threshold, hardcoded to 1000 for now
        if (balance > 1000) { 
             const senderId = await this.getSystemSenderId(student.schoolId);
             if (senderId) {
                const message = `Dear Parent, outstanding fee balance for ${student.name} is KES ${balance.toLocaleString()}. Please pay via M-Pesa.`;
                await this.communicationsService.sendSMS(student.guardianContact, message, student.id, senderId);
             }
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
