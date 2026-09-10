
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Payroll, PayrollItem, PayrollEntry, PayrollItemType, Staff, CalculationType } from '../entities/all-entities';
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

    // --- Tax Logic (Kept simplified for brevity) ---
    private calculatePAYE(taxablePay: number): number {
        const annualPay = taxablePay * 12;
        let tax = 0;
        if (annualPay <= 288000) tax = annualPay * 0.1;
        else if (annualPay <= 388000) tax = 28800 + (annualPay - 288000) * 0.25;
        else tax = 28800 + 25000 + (annualPay - 388000) * 0.30;
        return Math.max(0, (tax / 12) - 2400);
    }
    private calculateSHA(grossPay: number): number { return grossPay * 0.0275; }
    private calculateNSSF(grossPay: number): number { return Math.min(grossPay, 18000) * 0.06; }
    private calculateHousingLevy(grossPay: number): number { return grossPay * 0.015; }

    async savePayrollRun(payrollData: any[], schoolId: string): Promise<Payroll[]> {
        return this.entityManager.transaction(async transactionalEntityManager => {
            // FIX: Enforce en-US locale to match frontend and avoid duplication due to mismatch
            const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
            let entriesToProcess: any[] = []; 

            if (!payrollData || payrollData.length === 0) {
                // Auto-Generate: Fetch staff ONLY for this school
                const activeStaff = await this.staffRepo.find({ where: { schoolId: schoolId as any } });
                const recurringItems = await this.itemRepo.find({ where: { isRecurring: true, schoolId: schoolId as any } });

                entriesToProcess = activeStaff.map(staff => {
                    const salary = Number(staff.salary); // Ensure number
                    const earnings = [{ name: 'Basic Salary', amount: salary, type: PayrollItemType.Earning }];
                    
                    recurringItems.filter(i => i.type === PayrollItemType.Earning).forEach(item => {
                        const itemValue = Number(item.value); // Ensure number
                        const amount = item.calculationType === CalculationType.Percentage 
                            ? (itemValue / 100) * salary : itemValue;
                        earnings.push({ name: item.name, amount, type: PayrollItemType.Earning });
                    });
                    
                    const grossPay = earnings.reduce((sum, i) => sum + Number(i.amount), 0);
                    
                    const deductions = [
                        { name: 'PAYE', amount: this.calculatePAYE(grossPay), type: PayrollItemType.Deduction },
                        { name: 'SHA Contribution', amount: this.calculateSHA(grossPay), type: PayrollItemType.Deduction },
                        { name: 'NSSF', amount: this.calculateNSSF(grossPay), type: PayrollItemType.Deduction },
                        { name: 'Housing Levy', amount: this.calculateHousingLevy(grossPay), type: PayrollItemType.Deduction },
                    ];
                    
                    recurringItems.filter(i => i.type === PayrollItemType.Deduction).forEach(item => {
                        const itemValue = Number(item.value); // Ensure number
                        const amount = item.calculationType === CalculationType.Percentage 
                            ? (itemValue / 100) * salary : itemValue;
                        deductions.push({ name: item.name, amount, type: PayrollItemType.Deduction });
                    });
                    
                    const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount), 0);
                    const netPay = grossPay - totalDeductions;

                    return { staffId: staff.id, staffName: staff.name, month: currentMonth, payDate: new Date().toISOString().split('T')[0], grossPay, totalDeductions, netPay, earnings, deductions };
                });
            } else {
                entriesToProcess = payrollData;
            }

            const savedPayrollIds: string[] = [];

            for (const data of entriesToProcess) {
                // Ensure month string consistency if provided by frontend, otherwise use generated default
                // Ideally, frontend sends the month string it generated
                const month = data.month || currentMonth;

                // Cleanup using schoolId indirectly via Staff to verify safety
                const staff = await this.staffRepo.findOne({ where: { id: data.staffId, schoolId: schoolId as any } });
                if (!staff) { this.logger.warn(`Skipping payroll for staff ${data.staffId} - not in school.`); continue; }

                const existing = await transactionalEntityManager.findOne(Payroll, { where: { staffId: data.staffId, month } });
                if (existing) await transactionalEntityManager.remove(existing);

                const payroll = transactionalEntityManager.create(Payroll, {
                    staffId: data.staffId, month, payDate: data.payDate, grossPay: data.grossPay, totalDeductions: data.totalDeductions, netPay: data.netPay
                });
                const savedPayroll = await transactionalEntityManager.save(payroll);
                savedPayrollIds.push(savedPayroll.id);

                const allEntries = [...data.earnings.map((e:any) => ({...e, type: PayrollItemType.Earning, payroll: savedPayroll})), 
                                    ...data.deductions.map((d:any) => ({...d, type: PayrollItemType.Deduction, payroll: savedPayroll}))];
                await transactionalEntityManager.save(PayrollEntry, allEntries.map(e => transactionalEntityManager.create(PayrollEntry, e)));
            }

            // FIX: Reload saved payrolls with relations so frontend gets complete data immediately
            if (savedPayrollIds.length > 0) {
                return transactionalEntityManager.find(Payroll, {
                    where: savedPayrollIds.map(id => ({ id })),
                    relations: ['payrollEntries', 'staff'] // Load entries for "View Payslip" to work immediately
                });
            }

            return [];
        });
    }

    async getPayrollHistory(query: GetPayrollHistoryDto, schoolId: string): Promise<any> {
        const { page = 1, limit = 10, staffId, month } = query;
        const qb = this.payrollRepo.createQueryBuilder('payroll');
        qb.leftJoinAndSelect('payroll.staff', 'staff');
        qb.leftJoinAndSelect('payroll.payrollEntries', 'payrollEntries');
        
        // Multi-tenancy filter
        qb.where('staff.schoolId = :schoolId', { schoolId });

        if (staffId) qb.andWhere('payroll.staffId = :staffId', { staffId });
        if (month) qb.andWhere('payroll.month = :month', { month });

        qb.orderBy('payroll.payDate', 'DESC');
        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);
        const [payrolls, total] = await qb.getManyAndCount();

        const data = payrolls.map(p => ({
            id: p.id, staffId: p.staffId, staffName: p.staff ? p.staff.name : 'N/A', month: p.month, payDate: p.payDate,
            grossPay: p.grossPay, totalDeductions: p.totalDeductions, netPay: p.netPay,
            earnings: p.payrollEntries?.filter(e => e.type === PayrollItemType.Earning).map(e => ({ name: e.name, amount: e.amount })) || [],
            deductions: p.payrollEntries?.filter(e => e.type === PayrollItemType.Deduction).map(d => ({ name: d.name, amount: d.amount })) || []
        }));

        return { data, total, page, limit, last_page: Math.ceil(total / limit) };
    }

    createPayrollItem(itemData: Omit<PayrollItem, 'id'>, schoolId: string) {
        const item = this.itemRepo.create({ ...itemData, school: { id: schoolId } as any });
        return this.itemRepo.save(item);
    }

    getPayrollItems(schoolId: string) {
        return this.itemRepo.find({ where: { schoolId: schoolId as any } });
    }

    async updatePayrollItem(id: string, itemData: Partial<PayrollItem>, schoolId: string) {
        const item = await this.itemRepo.findOne({ where: { id, schoolId: schoolId as any } });
        if (!item) throw new NotFoundException(`Payroll item not found`);
        Object.assign(item, itemData);
        return this.itemRepo.save(item);
    }
    
    async deletePayrollItem(id: string, schoolId: string) {
        const result = await this.itemRepo.delete({ id, schoolId: schoolId as any });
        if (result.affected === 0) throw new NotFoundException(`Payroll item not found`);
    }
}
