import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Fee } from '../fees/entities/fee.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly tenancyService: TenancyService,
  ) {}

  async generateFinancialReport(startDate: Date, endDate: Date) {
    const tenantId = this.tenancyService.getTenantId();
    const fees = await this.feeRepository.find({
      where: { tenantId, dueDate: Between(startDate, endDate) },
    });
    const expenses = await this.expenseRepository.find({
      where: { tenantId, date: Between(startDate, endDate) },
    });

    const totalIncome = fees.reduce(
      (sum, fee) => sum + (fee.status === 'paid' ? Number(fee.amount) : 0),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      fees,
      expenses,
    };
  }

  async exportFinancialsToExcel(startDate: Date, endDate: Date): Promise<Buffer> {
    const report = await this.generateFinancialReport(startDate, endDate);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Financial Report');

    worksheet.columns = [
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
    ];

    report.fees.forEach(fee => {
      worksheet.addRow({
        type: 'Income (Fee)',
        description: `Fee for student ${fee.studentId}`,
        amount: fee.amount,
        date: fee.dueDate,
      });
    });

    report.expenses.forEach(expense => {
      worksheet.addRow({
        type: 'Expense',
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
      });
    });

    worksheet.addRow({});
    worksheet.addRow({ type: 'TOTAL INCOME', amount: report.totalIncome });
    worksheet.addRow({ type: 'TOTAL EXPENSES', amount: report.totalExpenses });
    worksheet.addRow({ type: 'NET PROFIT', amount: report.netProfit });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  async generateAttendanceReport(classLevelId: string) {
    const tenantId = this.tenancyService.getTenantId();
    return this.attendanceRepository.find({
      where: { tenantId, classLevelId },
      relations: ['student'],
    });
  }

  async getDashboardStats() {
    const tenantId = this.tenancyService.getTenantId();
    
    // Get total students
    const totalStudents = await this.feeRepository.manager.query(
      `SELECT COUNT(*) as count FROM students WHERE tenantId = ?`,
      [tenantId]
    ).then(res => parseInt(res[0].count, 10));

    // Get total staff
    const totalStaff = await this.feeRepository.manager.query(
      `SELECT COUNT(*) as count FROM staff WHERE tenantId = ?`,
      [tenantId]
    ).then(res => parseInt(res[0].count, 10));

    // Get total fees collected this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const fees = await this.feeRepository.find({
      where: { tenantId, dueDate: Between(startOfMonth, endOfMonth) },
    });
    
    const revenueThisMonth = fees.reduce(
      (sum, fee) => sum + (fee.status === 'paid' ? Number(fee.amount) : 0),
      0,
    );

    // Get recent activities (last 5 students added)
    const recentStudents = await this.feeRepository.manager.query(
      `SELECT id, name, email FROM students WHERE tenantId = ? ORDER BY id DESC LIMIT 5`,
      [tenantId]
    );

    return {
      totalStudents,
      totalStaff,
      revenueThisMonth,
      recentStudents,
    };
  }

  async getTeacherDashboardStats() {
    const tenantId = this.tenancyService.getTenantId();
    
    // For a real app, we'd filter by the teacher's assigned classes.
    // Here we'll return some aggregate stats for the teacher dashboard.
    const totalStudents = await this.feeRepository.manager.query(
      `SELECT COUNT(*) as count FROM students WHERE tenantId = ?`,
      [tenantId]
    ).then(res => parseInt(res[0].count, 10));

    const totalClasses = await this.feeRepository.manager.query(
      `SELECT COUNT(*) as count FROM sections WHERE tenantId = ?`,
      [tenantId]
    ).then(res => parseInt(res[0].count, 10));

    // Mock schedule for today
    const todaysSchedule = [
      { id: 1, time: '08:00 AM - 09:30 AM', subject: 'Mathematics', class: 'Grade 10A', room: 'Room 101' },
      { id: 2, time: '10:00 AM - 11:30 AM', subject: 'Physics', class: 'Grade 11B', room: 'Lab 2' },
      { id: 3, time: '12:30 PM - 02:00 PM', subject: 'Computer Science', class: 'Grade 12A', room: 'Computer Lab' },
    ];

    // Mock pending tasks
    const pendingTasks = [
      { id: 1, title: 'Grade Midterm Exams', due: 'Today', type: 'grading' },
      { id: 2, title: 'Submit Attendance for 10A', due: 'Today', type: 'attendance' },
      { id: 3, title: 'Review Science Projects', due: 'Tomorrow', type: 'review' },
    ];

    return {
      totalStudents,
      totalClasses,
      todaysSchedule,
      pendingTasks,
    };
  }

  async getParentDashboardStats() {
    const tenantId = this.tenancyService.getTenantId();
    
    // In a real app, we'd query the database for the specific parent's children.
    // For now, returning mock data that matches the frontend interface.
    return {
      children: [
        { id: '1', name: 'Alice Johnson', grade: 'Grade 10A', attendance: '98%', nextPaymentDue: 'Oct 1, 2026', nextPaymentAmount: 500 },
        { id: '2', name: 'Tommy Johnson', grade: 'Grade 8B', attendance: '95%', nextPaymentDue: 'Oct 1, 2026', nextPaymentAmount: 450 }
      ],
      recentGrades: [
        { id: 1, childName: 'Alice Johnson', subject: 'Mathematics', grade: 'A', date: 'Yesterday' },
        { id: 2, childName: 'Tommy Johnson', subject: 'Science', grade: 'B+', date: '2 days ago' },
        { id: 3, childName: 'Alice Johnson', subject: 'History', grade: 'A-', date: 'Last week' }
      ],
      upcomingEvents: [
        { id: 1, title: 'Parent-Teacher Conference', date: 'Oct 15, 2026', time: '14:00 - 16:00' },
        { id: 2, title: 'Science Fair', date: 'Oct 20, 2026', time: '09:00 - 12:00' }
      ]
    };
  }
}
