import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tenant } from '../tenants/entities/tenant.entity';
import {
  SubscriptionStatus,
  SubscriptionPlan,
} from 'src/common/subscription.enums';
import { PendingPayment } from '../payments/entities/pending-payment.entity';
import { Student } from '../students/entities/student.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { EmailService } from 'src/shared/email.service';

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
    private readonly emailService: EmailService,
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
      const approvedPayments: PendingPayment[] =
        await this.pendingPaymentRepository
          .find({
            where: { isApproved: true },
          })
          .catch(() => []);

      const totalRevenue = approvedPayments.reduce(
        (sum: number, payment: PendingPayment) =>
          sum + (Number(payment.amount) || 0),
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
      const tenants: Tenant[] = await this.tenantRepository
        .find()
        .catch(() => []);
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
      const recentPayments: PendingPayment[] =
        await this.pendingPaymentRepository
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
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    } as any);
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
    tenant.plan = plan as SubscriptionPlan;
    if (status) {
      tenant.subscriptionStatus = status as SubscriptionStatus;
    }
    return this.tenantRepository.save(tenant);
  }

  async confirmPayment(paymentId: string) {
    const payment = await this.pendingPaymentRepository.findOne({
      where: { id: paymentId },
      relations: ['tenant'],
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.isApproved) {
      throw new Error('Payment already approved');
    }

    // Approve payment
    payment.isApproved = true;
    await this.pendingPaymentRepository.save(payment);

    // Update tenant
    const tenant = payment.tenant;
    tenant.subscriptionStatus = SubscriptionStatus.ACTIVE;
    tenant.plan = payment.plan;

    const expiryDays = payment.billingCycle === 'annual' ? 366 : 31;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    tenant.expiresAt = expiresAt;

    await this.tenantRepository.save(tenant);

    // Generate Receipt
    const receiptBase64 = this.generateReceiptPDF(
      tenant,
      payment.amount,
      payment.reference,
      payment.plan,
    );

    // Send Receipt Email
    await this.emailService.sendEmailWithAttachments(
      tenant.contactEmail,
      'Subscription Payment Confirmed - SaaSLink',
      `Dear ${tenant.name},\n\nYour payment of KES ${payment.amount} has been confirmed. Your account is now active until ${expiresAt.toLocaleDateString()}.\n\nPlease find your receipt attached.`,
      [
        {
          filename: `Receipt-${payment.reference}.pdf`,
          content: receiptBase64,
          encoding: 'base64',
        },
      ],
    );

    return { message: 'Payment confirmed and tenant activated' };
  }

  async getInvoicePDF(paymentId: string) {
    const payment = await this.pendingPaymentRepository.findOne({
      where: { id: paymentId },
      relations: ['tenant'],
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    // Simple regeneration logic for invoice
    const doc = new jsPDF() as any;
    doc.setFontSize(22);
    doc.text('PROFORMA INVOICE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Reference: ${payment.reference}`, 20, 40);
    doc.text(`Date: ${payment.createdAt.toLocaleDateString()}`, 20, 45);
    doc.text(`School: ${payment.tenant.name}`, 20, 55);

    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Amount']],
      body: [
        [
          `Subscription Plan: ${payment.plan.toUpperCase()}`,
          `KES ${payment.amount.toLocaleString()}`,
        ],
        ['Total Payable', `KES ${payment.amount.toLocaleString()}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    return {
      pdfBase64: (doc.output('datauristring') as string).split(',')[1],
      filename: `Invoice-${payment.reference}.pdf`,
    };
  }

  async getReceiptPDFForDownload(paymentId: string) {
    const payment = await this.pendingPaymentRepository.findOne({
      where: { id: paymentId },
      relations: ['tenant'],
    });
    if (!payment) throw new NotFoundException('Payment record not found');
    if (!payment.isApproved) throw new Error('Payment not yet approved');

    const pdfBase64 = this.generateReceiptPDF(
      payment.tenant,
      payment.amount,
      payment.reference,
      payment.plan,
    );
    return {
      pdfBase64,
      filename: `Receipt-${payment.reference}.pdf`,
    };
  }

  async resendReceipt(paymentId: string) {
    const payment = await this.pendingPaymentRepository.findOne({
      where: { id: paymentId },
      relations: ['tenant'],
    });

    if (!payment || !payment.isApproved) {
      throw new Error('Approved payment not found');
    }

    const receiptBase64 = this.generateReceiptPDF(
      payment.tenant,
      payment.amount,
      payment.reference,
      payment.plan,
    );

    await this.emailService.sendEmailWithAttachments(
      payment.tenant.contactEmail,
      'Receipt Resent - SaaSLink',
      `Dear ${payment.tenant.name},\n\nAs requested, we are resending your receipt for the payment of KES ${payment.amount}.\n\nPlease find it attached.`,
      [
        {
          filename: `Receipt-${payment.reference}.pdf`,
          content: receiptBase64,
          encoding: 'base64',
        },
      ],
    );

    return { message: 'Receipt resent successfully' };
  }

  private generateReceiptPDF(
    tenant: Tenant,
    fee: number,
    reference: string,
    plan: SubscriptionPlan,
  ): string {
    const doc = new jsPDF() as any;
    const vatRate = 0.16; // 16% VAT
    const vatAmount = fee * vatRate;
    const totalAmount = fee + vatAmount;

    // Header
    doc.setFontSize(20);
    doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text('Issuer: Saaslink Technologies Limited', 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    doc.text(`Receipt #: REC-${reference.slice(4)}`, 20, 60);
    doc.text(`Reference: ${reference}`, 20, 70);

    // Bill To
    doc.text('Received From:', 20, 90);
    doc.text(tenant.name, 20, 100);
    doc.text(tenant.contactEmail || '', 20, 110);

    // Table
    autoTable(doc, {
      startY: 120,
      head: [['Description', 'Amount (KES)']],
      body: [
        [`Subscription Package: ${plan.toUpperCase()}`, fee.toFixed(2)],
        ['VAT (16%)', vatAmount.toFixed(2)],
        ['Total Paid', totalAmount.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [75, 181, 67] }, // Greenish for receipt
    });

    doc.setFontSize(14);
    doc.text(
      'Thank you for your business!',
      105,
      (doc as any).lastAutoTable.finalY + 20,
      { align: 'center' },
    );

    const output = doc.output('datauristring') as string;
    return output.split(',')[1];
  }
}
