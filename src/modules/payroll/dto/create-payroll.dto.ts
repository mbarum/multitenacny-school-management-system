export class CreatePayrollDto {
  staffId: string;
  salary: number;
  payDate: Date;
  status: 'paid' | 'unpaid';
}
