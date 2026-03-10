import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { SubscriptionStatus } from 'src/common/subscription.enums';
import { PendingPayment } from '../payments/entities/pending-payment.entity';
import { Student } from '../students/entities/student.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(PendingPayment)
    private readonly pendingPaymentRepository: Repository<PendingPayment>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  async getDashboardAnalytics() {
    const totalTenants = await this.tenantRepository.count();
    const activeSubscriptions = await this.tenantRepository.count({
      where: { subscriptionStatus: SubscriptionStatus.ACTIVE },
    });
    const pendingApprovals = await this.pendingPaymentRepository.count({
      where: { isApproved: false },
    });

    // Calculate total revenue from approved payments
    const approvedPayments = await this.pendingPaymentRepository.find({
      where: { isApproved: true },
    });
    const totalRevenue = approvedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    // Get total students across all tenants
    const totalStudents = await this.studentRepository.count();

    // Calculate average attendance rate
    const totalAttendanceRecords = await this.attendanceRepository.count();
    const presentAttendanceRecords = await this.attendanceRepository.count({ where: { status: 'present' } });
    const averageAttendance = totalAttendanceRecords > 0 
      ? Math.round((presentAttendanceRecords / totalAttendanceRecords) * 100) 
      : 0;

    // Get tenants by plan
    const tenants = await this.tenantRepository.find();
    const tenantsByPlan = tenants.reduce(
      (acc, tenant) => {
        acc[tenant.plan] = (acc[tenant.plan] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const tenantsByPlanArray = Object.keys(tenantsByPlan).map((plan) => ({
      name: plan,
      value: tenantsByPlan[plan],
    }));

    // Generate revenue over time (last 6 months)
    const revenueOverTime = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthPayments = approvedPayments.filter((p) => {
        const paymentDate = new Date(p.createdAt || new Date()); // Fallback if createdAt is null
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });

      const monthRevenue = monthPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );

      revenueOverTime.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        revenue: monthRevenue,
      });
    }

    // Get recent payments
    const recentPayments = await this.pendingPaymentRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['tenant'],
    });

    return {
      totalTenants,
      activeSubscriptions,
      pendingApprovals,
      totalRevenue,
      totalStudents,
      averageAttendance,
      tenantsByPlan: tenantsByPlanArray,
      revenueOverTime,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        tenantName: p.tenant?.name || 'Unknown',
        amount: p.amount,
        method: p.method,
        status: p.isApproved ? 'Approved' : 'Pending',
        date: p.createdAt || new Date(),
      })),
    };
  }


  async getAllTenants() {
    return this.tenantRepository.find();
  }

  async getTenantById(id: string) {
    const tenant = await this.tenantRepository.findOneBy({ id });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async getPendingPayments() {
    return this.pendingPaymentRepository.find({
      where: { isApproved: false },
      relations: ['tenant'],
    });
  }
}
