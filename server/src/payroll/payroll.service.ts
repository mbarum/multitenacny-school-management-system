
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Payroll, PayrollItem, PayrollEntry, PayrollItemType, Staff, CalculationType, PayrollItemCategory } from '../entities/all-entities';
import { GetPayrollHistoryDto } from './dto/get-payroll-history.dto';

@Injectable()
export class PayrollService {
    private readonly logger = new Logger(PayrollService.name);

    constructor(
        @InjectRepository(Payroll) private readonly payrollRepo: Repository<Payroll>,
        @InjectRepository(PayrollItem) private readonly itemRepo: Repository<PayrollItem>,
        @InjectRepository(Staff) private readonly staffRepo: Repository<Staff>,
        private readonly entityManager: EntityManager,
    ) {}

    // --- Tax Calculation Logic (Kenya 2024 Context) ---
    
    private calculatePAYE(taxablePay: number): number {
        // Annualize for bands
        const annualPay = taxablePay * 12;
        let tax = 0;
        
        // PAYE Bands (Simplified/Standard)
        if (annualPay <= 288000) {
            tax = annualPay * 0.1;
        } else if (annualPay <= 388000) {
            tax = 28800 + (annualPay - 288000) * 0.25;
        } else {
            tax = 28800 + 25000 + (annualPay - 388000) * 0.30;
        }
        
        // Monthly relief (standard ~2400)
        return Math.max(0, (tax / 12) - 2400);
    }

    private calculateSHA(grossPay: number): number {
        // Social Health Insurance Fund (approx 2.75%)
        return grossPay * 0.0275;
    }

    private calculateNSSF(grossPay: number): number {
        // Tiered NSSF (Simplified cap at 18k for Tier 1+2 combined usually)
        // Using simplified logic from frontend: min(gross, 18000) * 6%
        return Math.min(grossPay, 18000) * 0.06;
    }

    private calculateHousingLevy(grossPay: number): number {
        // 1.5% of Gross
        return grossPay * 0.015;
    }

    // --- Payroll Processing ---

    async savePayrollRun(payrollData: any[]): Promise<Payroll[]> {
        return this.entityManager.transaction(async transactionalEntityManager => {
            const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
            let entriesToProcess = [];

            // Scenario 1: Auto-Generate (Frontend sent empty array)
            if (!payrollData || payrollData.length === 0) {
                this.logger.log(`Auto-generating payroll for ${currentMonth}`);
                
                const activeStaff = await this.staffRepo.find();
                const recurringItems = await this.itemRepo.find({ where: { isRecurring: true } });

                entriesToProcess = activeStaff.map(staff => {
                    const earnings = [{ name: 'Basic Salary', amount: staff.salary, type: PayrollItemType.Earning }];
                    
                    // Add recurring earnings
                    recurringItems
                        .filter(i => i.type === PayrollItemType.Earning)
                        .forEach(item => {
                            const amount = item.calculationType === CalculationType.Percentage 
                                ? (item.value / 100) * staff.salary 
                                : item.value;
                            earnings.push({ name: item.name, amount, type: PayrollItemType.Earning });
                        });

                    const grossPay = earnings.reduce((sum, i) => sum + i.amount, 0);

                    // Calculate Deductions
                    const deductions = [
                        { name: 'PAYE', amount: this.calculatePAYE(grossPay), type: PayrollItemType.Deduction },
                        { name: 'SHA Contribution', amount: this.calculateSHA(grossPay), type: PayrollItemType.Deduction },
                        { name: 'NSSF', amount: this.calculateNSSF(grossPay), type: PayrollItemType.Deduction },
                        { name: 'Housing Levy', amount: this.calculateHousingLevy(grossPay), type: PayrollItemType.Deduction },
                    ];

                    // Add recurring deductions (e.g. Loans)
                    recurringItems
                        .filter(i => i.type === PayrollItemType.Deduction)
                        .forEach(item => {
                            const amount = item.calculationType === CalculationType.Percentage 
                                ? (item.value / 100) * staff.salary 
                                : item.value;
                            deductions.push({ name: item.name, amount, type: PayrollItemType.Deduction });
                        });

                    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
                    const netPay = grossPay - totalDeductions;

                    return {
                        staffId: staff.id,
                        staffName: staff.name,
                        month: currentMonth,
                        payDate: new Date().toISOString().split('T')[0],
                        grossPay,
                        totalDeductions,
                        netPay,
                        earnings,
                        deductions
                    };
                });
            } else {
                // Scenario 2: Manual Save (Frontend sent edited data)
                this.logger.log(`Saving manual payroll payload for ${payrollData[0]?.month}`);
                entriesToProcess = payrollData;
            }

            const savedPayrolls: Payroll[] = [];

            for (const data of entriesToProcess) {
                // 1. Cleanup existing payroll for this staff/month to allow re-runs
                const existing = await transactionalEntityManager.findOne(Payroll, { 
                    where: { staffId: data.staffId, month: data.month } 
                });
                
                if (existing) {
                    await transactionalEntityManager.remove(existing);
                }

                // 2. Create Payroll Record
                const payroll = transactionalEntityManager.create(Payroll, {
                    staffId: data.staffId,
                    month: data.month,
                    payDate: data.payDate,
                    grossPay: data.grossPay,
                    totalDeductions: data.totalDeductions,
                    netPay: data.netPay
                });
                const savedPayroll = await transactionalEntityManager.save(payroll);

                // 3. Create Entries
                // Map raw data to entity structure, ensuring type is set
                const earnings = data.earnings.map((e: any) => ({ 
                    name: e.name, 
                    amount: e.amount, 
                    type: PayrollItemType.Earning, 
                    payroll: savedPayroll 
                }));
                
                const deductions = data.deductions.map((d: any) => ({ 
                    name: d.name, 
                    amount: d.amount, 
                    type: PayrollItemType.Deduction, 
                    payroll: savedPayroll 
                }));
                
                const allEntries = [...earnings, ...deductions].map(e => 
                    transactionalEntityManager.create(PayrollEntry, e)
                );
                await transactionalEntityManager.save(PayrollEntry, allEntries);
                
                savedPayrolls.push(savedPayroll);
            }
            
            return savedPayrolls;
        });
    }

    async getPayrollHistory(query: GetPayrollHistoryDto): Promise<any> {
        const { page = 1, limit = 10, staffId, month } = query;
        const qb = this.payrollRepo.createQueryBuilder('payroll');
        
        qb.leftJoinAndSelect('payroll.staff', 'staff');
        qb.leftJoinAndSelect('payroll.payrollEntries', 'payrollEntries');

        if (staffId) {
            qb.andWhere('payroll.staffId = :staffId', { staffId });
        }

        if (month) {
             qb.andWhere('payroll.month = :month', { month });
        }

        qb.orderBy('payroll.payDate', 'DESC');

        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const [payrolls, total] = await qb.getManyAndCount();

        const data = payrolls.map(p => {
            const earnings = p.payrollEntries ? p.payrollEntries.filter(e => e.type === PayrollItemType.Earning) : [];
            const deductions = p.payrollEntries ? p.payrollEntries.filter(e => e.type === PayrollItemType.Deduction) : [];
            return {
                id: p.id,
                staffId: p.staffId,
                staffName: p.staff ? p.staff.name : 'N/A',
                month: p.month,
                payDate: p.payDate,
                grossPay: p.grossPay,
                totalDeductions: p.totalDeductions,
                netPay: p.netPay,
                earnings: earnings.map(e => ({ name: e.name, amount: e.amount })),
                deductions: deductions.map(d => ({ name: d.name, amount: d.amount })),
            };
        });

        return {
            data,
            total,
            page,
            limit,
            last_page: Math.ceil(total / limit),
        };
    }

    createPayrollItem(itemData: Omit<PayrollItem, 'id'>): Promise<PayrollItem> {
        const item = this.itemRepo.create(itemData);
        return this.itemRepo.save(item);
    }

    getPayrollItems(): Promise<PayrollItem[]> {
        return this.itemRepo.find();
    }

    async updatePayrollItem(id: string, itemData: Partial<PayrollItem>): Promise<PayrollItem> {
        const item = await this.itemRepo.preload({ id, ...itemData });
        if (!item) {
            throw new NotFoundException(`Payroll item with ID ${id} not found`);
        }
        return this.itemRepo.save(item);
    }
    
    async deletePayrollItem(id: string): Promise<void> {
        const result = await this.itemRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Payroll item with ID ${id} not found`);
        }
    }
}
