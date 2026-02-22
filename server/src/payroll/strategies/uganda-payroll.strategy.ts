import { PayrollStrategy } from './payroll.strategy';

export class UgandaPayrollStrategy implements PayrollStrategy {
  calculateDeductions(grossPay: number) {
    const paye = this.calculatePAYE(grossPay);
    const nssf = this.calculateNSSF(grossPay);
    return [
      { name: 'PAYE', amount: paye },
      { name: 'NSSF', amount: nssf },
    ];
  }

  private calculatePAYE(grossPay: number): number {
    if (grossPay <= 235000) return 0;
    if (grossPay <= 335000) return (grossPay - 235000) * 0.1;
    if (grossPay <= 410000) return 10000 + (grossPay - 335000) * 0.2;
    return 25000 + (grossPay - 410000) * 0.3;
  }

  private calculateNSSF(grossPay: number): number {
    return grossPay * 0.05;
  }
}
