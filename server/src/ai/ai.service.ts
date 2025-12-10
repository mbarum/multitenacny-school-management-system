
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, Transaction, TransactionType } from '../entities/all-entities';

@Injectable()
export class AiService {
  private readonly ai: GoogleGenAI | null = null;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
  ) {
    const apiKey = this.configService.get<string>('API_KEY');
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn("API_KEY environment variable is not set. AI features (Financial Summary) will be disabled.");
    }
  }

  async generateFinancialSummary(schoolId: string): Promise<{ summary: string }> {
    if (!this.ai) {
        return { summary: "AI configuration is missing (API_KEY not set). Please contact the administrator." };
    }

    try {
      const revenueResult = await this.transactionRepo
        .createQueryBuilder('t')
        .select('SUM(t.amount)', 'total')
        .where('t.type = :type', { type: TransactionType.Payment })
        .andWhere('t.schoolId = :schoolId', { schoolId })
        .getRawOne();
      const totalIncome = parseFloat(revenueResult.total) || 0;

      const expenseResult = await this.expenseRepo
        .createQueryBuilder('e')
        .select('SUM(e.amount)', 'total')
        .where('e.schoolId = :schoolId', { schoolId })
        .getRawOne();
      const totalExpenses = parseFloat(expenseResult.total) || 0;
      
      const recentExpenses = await this.expenseRepo.find({
          where: { schoolId: schoolId as any },
          order: { date: 'DESC' },
          take: 5
      });
      
      const expenseSummary = recentExpenses
        .map(e => `- ${e.category}: KES ${e.amount.toLocaleString()} for ${e.description}`)
        .join('\n');

      const prompt = `
        You are an expert financial analyst for a school. Analyze the following financial data and provide a concise, professional summary in markdown format.

        **Financial Data:**
        - Total Income from Fees: KES ${totalIncome.toLocaleString()}
        - Total Expenses: KES ${totalExpenses.toLocaleString()}

        **Recent Expense Breakdown (sample):**
        ${expenseSummary || 'No expenses recorded.'}

        **Your Task:**
        Generate a summary that includes the following sections:
        1.  **Overall Status:** A brief sentence on the school's financial health.
        2.  **Key Figures:** Clearly state the total income, total expenses, and the resulting net profit or loss.
        3.  **Expense Insights:** Briefly mention significant expense categories based on the sample.
        4.  **Recommendation:** Provide one brief, actionable recommendation.

        The response should be well-formatted using markdown with bold headings for each section.
      `;
      
      const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
      });

      return { summary: response.text ?? 'AI summary could not be generated at this time.' };

    } catch (error) {
      this.logger.error("Error calling Gemini API:", error);
      throw new InternalServerErrorException('Failed to generate AI summary.');
    }
  }
}
