import { PayrollStrategy } from './payroll.strategy';

export class KenyaPayrollStrategy implements PayrollStrategy {
  calculateDeductions(grossPay: number) {
    const paye = this.calculatePAYE(grossPay);
    const nssf = this.calculateNSSF(grossPay);
    const nhif = this.calculateNHIF(grossPay);
    const housingLevy = grossPay * 0.015;
    return [
      { name: 'PAYE', amount: paye },
      { name: 'NSSF', amount: nssf },
      { name: 'NHIF', amount: nhif },
      { name: 'Housing Levy', amount: housingLevy },
    ];
  }

  private calculatePAYE(grossPay: number): number {
    const annualPay = grossPay * 12;
    let tax = 0;
    if (annualPay <= 288000) tax = annualPay * 0.1;
    else if (annualPay <= 388000) tax = 28800 + (annualPay - 288000) * 0.25;
    else tax = 28800 + 25000 + (annualPay - 388000) * 0.3;
    return Math.max(0, tax / 12 - 2400);
  }

  private calculateNSSF(grossPay: number): number {
    return Math.min(grossPay * 0.06, 1080);
  }

  private calculateNHIF(grossPay: number): number {
    if (grossPay <= 5999) return 150;
    if (grossPay <= 7999) return 300;
    if (grossPay <= 11999) return 400;
    if (grossPay <= 14999) return 500;
    if (grossPay <= 19999) return 600;
    if (grossPay <= 24999) return 750;
    if (grossPay <= 29999) return 850;
    if (grossPay <= 34999) return 900;
    if (grossPay <= 39999) return 950;
    if (grossPay <= 44999) return 1000;
    if (grossPay <= 49999) return 1100;
    if (grossPay <= 59999) return 1200;
    if (grossPay <= 69999) return 1300;
    if (grossPay <= 79999) return 1400;
    if (grossPay <= 89999) return 1500;
    if (grossPay <= 99999) return 1600;
    return 1700;
  }
}
