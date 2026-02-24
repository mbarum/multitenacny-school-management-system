export class CreateExpenseDto {
  category: string;
  amount: number;
  date: Date;
  description?: string;
}
