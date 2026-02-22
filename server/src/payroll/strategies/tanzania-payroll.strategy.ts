import { PayrollStrategy } from './payroll.strategy';

export class TanzaniaPayrollStrategy implements PayrollStrategy {
  calculateDeductions(grossPay: number) {
    const paye = this.calculatePAYE(grossPay);
    const sdl = grossPay * 0.045;
    return [
      { name: 'PAYE', amount: paye },
      { name: 'SDL', amount: sdl },
    ];
  }

  private calculatePAYE(grossPay: number): number {
    if (grossPay <= 270000) return 0;
    if (grossPay <= 520000) return (grossPay - 270000) * 0.09;
    if (grossPay <= 760000) return 22500 + (grossPay - 520000) * 0.2;
    if (grossPay <= 1000000) return 70500 + (grossPay - 760000) * 0.25;
    return 130500 + (grossPay - 1000000) * 0.3;
  }
}
