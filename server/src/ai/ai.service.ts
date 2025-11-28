
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, Transaction, TransactionType } from '../entities/all-entities';

@Injectable()
export class AiService {
  private readonly ai: GoogleGenAI;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
  ) {
    const apiKey = this.configService.get<string>('API_KEY');
    if (!apiKey) {
      throw new Error("API_KEY environment variable is not set for the backend.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateFinancialSummary(): Promise<{ summary: string }> {
    try {
      // 1. Fetch Data directly from DB
      const revenueResult = await this.transactionRepo
        .createQueryBuilder('t')
        .select('SUM(t.amount)', 'total')
        .where('t.type = :type', { type: TransactionType.Payment })
        .getRawOne();
      const totalIncome = parseFloat(revenueResult.total) || 0;

      const expenseResult = await this.expenseRepo
        .createQueryBuilder('e')
        .select('SUM(e.amount)', 'total')
        .getRawOne();
      const totalExpenses = parseFloat(expenseResult.total) || 0;
      
      const recentExpenses = await this.expenseRepo.find({
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
        1.  **Overall Status:** A brief sentence on the school's financial health (e.g., profitable, at a loss).
        2.  **Key Figures:** Clearly state the total income, total expenses, and the resulting net profit or loss.
        3.  **Expense Insights:** Briefly mention the most significant expense categories based on the provided sample data.
        4.  **Recommendation:** Provide one brief, actionable recommendation for the school administration based on this data.

        The response should be well-formatted using markdown with bold headings for each section.
      `;
      
      const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
      });

      return { summary: response.text ?? 'AI summary could not be generated at this time.' };

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new InternalServerErrorException('Failed to generate AI summary.');
    }
  }
}
