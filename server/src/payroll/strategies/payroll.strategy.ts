export interface PayrollStrategy {
  calculateDeductions(grossPay: number): { name: string; amount: number }[];
}
