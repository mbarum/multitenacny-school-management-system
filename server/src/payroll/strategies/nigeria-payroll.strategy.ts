import { PayrollStrategy } from './payroll.strategy';

export class NigeriaPayrollStrategy implements PayrollStrategy {
  calculateDeductions(grossPay: number) {
    const paye = this.calculatePAYE(grossPay);
    const pension = grossPay * 0.08;
    return [
      { name: 'PAYE', amount: paye },
      { name: 'Pension', amount: pension },
    ];
  }

  private calculatePAYE(grossPay: number): number {
    const annualPay = grossPay * 12;
    let tax = 0;
    if (annualPay <= 300000) tax = annualPay * 0.07;
    else if (annualPay <= 600000) tax = 21000 + (annualPay - 300000) * 0.11;
    else if (annualPay <= 1100000) tax = 54000 + (annualPay - 600000) * 0.15;
    else if (annualPay <= 1600000) tax = 129000 + (annualPay - 1100000) * 0.19;
    else if (annualPay <= 3200000) tax = 224000 + (annualPay - 1600000) * 0.21;
    else tax = 560000 + (annualPay - 3200000) * 0.24;
    return tax / 12;
  }
}
