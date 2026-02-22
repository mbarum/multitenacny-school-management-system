import { Injectable } from '@nestjs/common';
import { Country } from '../entities/school.entity';
import { PayrollStrategy, KenyaPayrollStrategy, UgandaPayrollStrategy, TanzaniaPayrollStrategy, NigeriaPayrollStrategy, UKPayrollStrategy } from './strategies';

@Injectable()
export class PayrollStrategyFactory {
  private strategies: Map<Country, PayrollStrategy> = new Map();

  constructor() {
    this.strategies.set(Country.Kenya, new KenyaPayrollStrategy());
    this.strategies.set(Country.Uganda, new UgandaPayrollStrategy());
    this.strategies.set(Country.Tanzania, new TanzaniaPayrollStrategy());
    this.strategies.set(Country.Nigeria, new NigeriaPayrollStrategy());
    this.strategies.set(Country.UnitedKingdom, new UKPayrollStrategy());
  }

  getStrategy(country: Country): PayrollStrategy {
    const strategy = this.strategies.get(country);
    if (!strategy) {
      throw new Error(`Payroll strategy for ${country} not found.`);
    }
    return strategy;
  }
}
