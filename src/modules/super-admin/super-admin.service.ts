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
    try {
      const totalTenants = await this.tenantRepository.count().catch(() => 0);
      const activeSubscriptions = await this.tenantRepository
        .count({
          where: { subscriptionStatus: SubscriptionStatus.ACTIVE },
        })
        .catch(() => 0);
      const pendingApprovals = await this.pendingPaymentRepository
        .count({
          where: { isApproved: false },
        })
        .catch(() => 0);

      // Calculate total revenue from approved payments
      const approvedPayments: PendingPayment[] = await this.pendingPaymentRepository
        .find({
          where: { isApproved: true },
        })
        .catch(() => []);

      const totalRevenue = approvedPayments.reduce(
        (sum: number, payment: PendingPayment) => sum + (Number(payment.amount) || 0),
        0,
      );

      // Get total students across all tenants
      const totalStudents = await this.studentRepository.count().catch(() => 0);

      // Calculate average attendance rate
      const totalAttendanceRecords = await this.attendanceRepository
        .count()
        .catch(() => 0);
      const presentAttendanceRecords = await this.attendanceRepository
        .count({
          where: { status: 'present' },
        })
        .catch(() => 0);
      const averageAttendance =
        totalAttendanceRecords > 0
          ? Math.round(
              (presentAttendanceRecords / totalAttendanceRecords) * 100,
            )
          : 0;

      // Get tenants by plan
      const tenants: Tenant[] = await this.tenantRepository.find().catch(() => []);
      const tenantsByPlan = tenants.reduce(
        (acc: Record<string, number>, tenant: Tenant) => {
          const plan = tenant.plan || 'unknown';
          acc[plan] = (acc[plan] || 0) + 1;
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

        const monthPayments = approvedPayments.filter((p: PendingPayment) => {
          const paymentDate = new Date(p.createdAt || new Date());
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        });

        const monthRevenue = monthPayments.reduce(
          (sum: number, p: PendingPayment) => sum + (Number(p.amount) || 0),
          0,
        );

        revenueOverTime.push({
          month: monthStart.toLocaleString('default', { month: 'short' }),
          revenue: monthRevenue,
        });
      }

      // Get recent payments
      const recentPayments: PendingPayment[] = await this.pendingPaymentRepository
        .find({
          order: { createdAt: 'DESC' },
          take: 5,
          relations: ['tenant'],
        })
        .catch(() => []);

      return {
        totalTenants,
        activeSubscriptions,
        pendingApprovals,
        totalRevenue,
        totalStudents,
        averageAttendance,
        tenantsByPlan:
          tenantsByPlanArray.length > 0
            ? tenantsByPlanArray
            : [{ name: 'none', value: 0 }],
        revenueOverTime,
        recentPayments: recentPayments.map((p: PendingPayment) => ({
          id: p.id,
          tenantName: p.tenant?.name || 'Unknown',
          amount: p.amount || 0,
          method: p.method || 'unknown',
          status: p.isApproved ? 'Approved' : 'Pending',
          date: p.createdAt || new Date(),
        })),
      };
    } catch (error) {
      console.error(
        '[SuperAdminService] Failed to load dashboard analytics:',
        error,
      );
      // Return a safe default object instead of throwing
      return {
        totalTenants: 0,
        activeSubscriptions: 0,
        pendingApprovals: 0,
        totalRevenue: 0,
        totalStudents: 0,
        averageAttendance: 0,
        tenantsByPlan: [{ name: 'none', value: 0 }],
        revenueOverTime: [],
        recentPayments: [],
      };
    }
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

  async updateTenantStatus(id: string, status: string) {
    const tenant = await this.getTenantById(id);
    tenant.subscriptionStatus = status as SubscriptionStatus;
    return this.tenantRepository.save(tenant);
  }

  async updateTenantPlan(id: string, plan: string, status?: string) {
    const tenant = await this.getTenantById(id);
    tenant.plan = plan as any;
    if (status) {
      tenant.subscriptionStatus = status as SubscriptionStatus;
    }
    return this.tenantRepository.save(tenant);
  }
}
