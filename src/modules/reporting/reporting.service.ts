import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Fee } from '../fees/entities/fee.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Student } from '../students/entities/student.entity';
import { TimetableEntry } from '../timetable/entities/timetable-entry.entity';
import { ReportCard } from '../report-cards/entities/report-card.entity';
import { CalendarEvent } from '../calendar/entities/calendar-event.entity';
import { Subject } from '../academics/entities/subject.entity';
import { Examination } from '../examinations/entities/examination.entity';
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
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(TimetableEntry)
    private readonly timetableRepository: Repository<TimetableEntry>,
    @InjectRepository(ReportCard)
    private readonly reportCardRepository: Repository<ReportCard>,
    @InjectRepository(CalendarEvent)
    private readonly calendarEventRepository: Repository<CalendarEvent>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Examination)
    private readonly examinationRepository: Repository<Examination>,
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

  async exportFinancialsToExcel(
    startDate: Date,
    endDate: Date,
  ): Promise<Buffer> {
    const report = await this.generateFinancialReport(startDate, endDate);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Financial Report');

    worksheet.columns = [
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
    ];

    report.fees.forEach((fee) => {
      worksheet.addRow({
        type: 'Income (Fee)',
        description: `Fee for student ${fee.studentId}`,
        amount: fee.amount,
        date: fee.dueDate,
      });
    });

    report.expenses.forEach((expense) => {
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
    const totalStudents = await this.feeRepository.manager
      .query(`SELECT COUNT(*) as count FROM students WHERE tenantId = ?`, [
        tenantId,
      ])
      .then((res: { count: string }[]) => parseInt(res[0].count, 10));

    // Get total staff
    const totalStaff = await this.feeRepository.manager
      .query(`SELECT COUNT(*) as count FROM staff WHERE tenantId = ?`, [
        tenantId,
      ])
      .then((res: { count: string }[]) => parseInt(res[0].count, 10));

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
    const recentStudentsRaw = await this.studentRepository.find({
      where: { tenantId },
      order: { id: 'DESC' },
      take: 5,
    });

    const recentStudents = recentStudentsRaw.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      email: s.registrationNumber || 'N/A', // Use regNo as fallback since no email
    }));

    return {
      totalStudents,
      totalStaff,
      revenueThisMonth,
      recentStudents,
    };
  }

  async getTeacherDashboardStats(userId: string) {
    const tenantId = this.tenancyService.getTenantId();

    // Get total students in the school
    const totalStudents = await this.studentRepository.count({
      where: { tenantId },
    });

    // Get total classes (sections)
    const totalClasses = await this.feeRepository.manager
      .query(`SELECT COUNT(*) as count FROM sections WHERE tenantId = ?`, [
        tenantId,
      ])
      .then((res: { count: string }[]) => parseInt(res[0].count, 10));

    // Get today's schedule for this teacher
    const today = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    const todaysScheduleRaw = await this.timetableRepository.find({
      where: {
        tenantId,
        teacherId: userId,
        dayOfWeek: today as
          | 'monday'
          | 'tuesday'
          | 'wednesday'
          | 'thursday'
          | 'friday',
      },
      order: { startTime: 'ASC' },
    });

    const todaysSchedule = await Promise.all(
      todaysScheduleRaw.map(async (entry) => {
        const subject = await this.subjectRepository.findOne({
          where: { id: entry.subjectId },
        });
        return {
          id: entry.id,
          time: `${entry.startTime} - ${entry.endTime}`,
          subject: subject ? subject.name : 'Unknown Subject',
          class: entry.classLevel,
          room: 'Assigned Room', // Could fetch from section if linked
        };
      }),
    );

    // Derive pending tasks from real data
    const pendingTasks = [];
    let taskIdCounter = 1;

    // 1. Grading tasks: Exams in the past 7 days for subjects taught by this teacher
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentExams = await this.examinationRepository.find({
      where: { tenantId, date: Between(sevenDaysAgo, new Date()) },
    });

    for (const exam of recentExams) {
      const subject = await this.subjectRepository.findOne({
        where: { id: exam.subjectId, teacherId: userId },
      });
      if (subject) {
        pendingTasks.push({
          id: taskIdCounter++,
          title: `Grade ${exam.name} - ${subject.name}`,
          due: 'Soon',
          type: 'grading',
        });
      }
    }

    // 2. Attendance tasks: Classes taught today
    for (const session of todaysSchedule) {
      pendingTasks.push({
        id: taskIdCounter++,
        title: `Submit Attendance for ${session.class} - ${session.subject}`,
        due: 'Today',
        type: 'attendance',
      });
    }

    return {
      totalStudents,
      totalClasses,
      todaysSchedule,
      pendingTasks,
    };
  }

  async getParentDashboardStats(userId: string) {
    const tenantId = this.tenancyService.getTenantId();

    // Fetch children for this parent
    const childrenRaw = await this.studentRepository.find({
      where: { tenantId, parentId: userId },
      relations: ['classLevel', 'section'],
    });

    const children = await Promise.all(
      childrenRaw.map(async (child) => {
        // Calculate attendance
        const totalDays = await this.attendanceRepository.count({
          where: { studentId: child.id },
        });
        const presentDays = await this.attendanceRepository.count({
          where: { studentId: child.id, status: 'present' },
        });
        const attendance =
          totalDays > 0
            ? Math.round((presentDays / totalDays) * 100) + '%'
            : 'N/A';

        // Next payment
        const nextFee = await this.feeRepository.findOne({
          where: { studentId: child.id, status: 'unpaid' },
          order: { dueDate: 'ASC' },
        });

        return {
          id: child.id,
          name: `${child.firstName} ${child.lastName}`,
          grade: child.classLevel ? child.classLevel.name : 'Unknown Grade',
          attendance,
          nextPaymentDue: nextFee
            ? nextFee.dueDate.toDateString()
            : 'No pending fees',
          nextPaymentAmount: nextFee ? Number(nextFee.amount) : 0,
        };
      }),
    );

    // Fetch recent grades for these children
    const childIds = childrenRaw.map((c) => c.id);
    let recentGrades = [];
    if (childIds.length > 0) {
      const gradesRaw = await this.reportCardRepository.find({
        where: childIds.map((id) => ({ studentId: id, tenantId })),
        order: { id: 'DESC' }, // Assuming newer IDs are more recent, or add createdAt
        take: 5,
      });

      recentGrades = await Promise.all(
        gradesRaw.map(async (grade) => {
          const student = childrenRaw.find((c) => c.id === grade.studentId);
          const exam = await this.examinationRepository.findOne({
            where: { id: grade.examinationId },
          });
          const subject = exam
            ? await this.subjectRepository.findOne({
                where: { id: exam.subjectId },
              })
            : null;

          return {
            id: grade.id,
            childName: student
              ? `${student.firstName} ${student.lastName}`
              : 'Unknown',
            subject: subject ? subject.name : 'Unknown Subject',
            grade: grade.grade || grade.marks.toString(),
            date: exam ? exam.date.toDateString() : 'Unknown Date',
          };
        }),
      );
    }

    // Upcoming events
    const now = new Date();
    const upcomingEventsRaw = await this.calendarEventRepository.find({
      where: {
        tenantId,
        start: Between(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
      },
      order: { start: 'ASC' },
      take: 5,
    });

    const upcomingEvents = upcomingEventsRaw.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.start.toDateString(),
      time: `${event.start.getHours()}:${event.start.getMinutes().toString().padStart(2, '0')} - ${event.end.getHours()}:${event.end.getMinutes().toString().padStart(2, '0')}`,
    }));

    return {
      children,
      recentGrades,
      upcomingEvents,
    };
  }
}
