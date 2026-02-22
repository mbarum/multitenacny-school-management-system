import { PayrollStrategy } from './payroll.strategy';

export class UKPayrollStrategy implements PayrollStrategy {
  calculateDeductions(grossPay: number) {
    const paye = this.calculatePAYE(grossPay);
    const ni = this.calculateNI(grossPay);
    return [
      { name: 'PAYE', amount: paye },
      { name: 'National Insurance', amount: ni },
    ];
  }

  private calculatePAYE(grossPay: number): number {
    const annualPay = grossPay * 12;
    if (annualPay <= 12570) return 0;
    if (annualPay <= 50270) return ((annualPay - 12570) * 0.2) / 12;
    if (annualPay <= 150000) return (7540 + (annualPay - 50270) * 0.4) / 12;
    return (47432 + (annualPay - 150000) * 0.45) / 12;
  }

  private calculateNI(grossPay: number): number {
    const weeklyPay = grossPay / 4.33;
    if (weeklyPay <= 242) return 0;
    if (weeklyPay <= 967) return (weeklyPay - 242) * 0.12;
    return 86.99 + (weeklyPay - 967) * 0.02;
  }
}
