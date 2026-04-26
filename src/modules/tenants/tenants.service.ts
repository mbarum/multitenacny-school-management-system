import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import {
  SubscriptionStatus,
  SubscriptionPlan,
} from '../../common/subscription.enums';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../shared/email.service';
import * as bcrypt from 'bcrypt';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserRole } from '../../common/user-role.enum';
import * as crypto from 'crypto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createTenantDto: CreateTenantDto,
    initialAdmin?: { email: string; password?: string; username?: string },
  ): Promise<Tenant> {
    const existing = await this.tenantRepository.findOne({
      where: [
        { name: createTenantDto.name },
        { domain: createTenantDto.domain },
      ],
    });
    if (existing) {
      throw new BadRequestException(
        'A school with this name or domain already exists.',
      );
    }

    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      contactEmail: createTenantDto.email,
    });

    // If the plan is not free, they must pay before it becomes active
    if (tenant.plan && tenant.plan !== SubscriptionPlan.FREE) {
      tenant.subscriptionStatus = SubscriptionStatus.INACTIVE;
    } else {
      tenant.subscriptionStatus = SubscriptionStatus.ACTIVE;
    }

    const savedTenant = await this.tenantRepository.save(tenant);

    // 1. Create Default Admin User
    const rawPassword =
      initialAdmin?.password ||
      crypto.randomBytes(6).toString('hex').slice(0, 8);
    const username =
      initialAdmin?.username || `admin_${savedTenant.domain.split('.')[0]}`;
    const email = initialAdmin?.email || createTenantDto.email;

    // We need to bypass the tenant-aware restriction for the first user
    // UsersService.createRaw calls repository.save directly which doesn't use the tenantId from tenancyService if we provide it
    await this.usersService.createRaw({
      username,
      email,
      password_hash: await bcrypt.hash(rawPassword, 12),
      role: UserRole.ADMIN,
      tenantId: savedTenant.id,
    });

    // 2. Generate Invoice with VAT
    const invoiceBase64 = this.generateInvoicePDF(
      savedTenant,
      createTenantDto.subscriptionFee || 0,
    );

    // 3. Send Onboarding Email
    await this.sendOnboardingEmail(
      createTenantDto.email,
      savedTenant.name,
      username,
      rawPassword,
      invoiceBase64,
    );

    // Cache the new tenant
    await this.cacheManager.set(`tenant_${savedTenant.id}`, savedTenant);
    return savedTenant;
  }

  private generateInvoicePDF(tenant: Tenant, feeInput: any): string {
    const doc = new jsPDF() as any;

    // Extremely defensive fee parsing
    let fee = 0;
    if (typeof feeInput === 'number') {
      fee = feeInput;
    } else if (typeof feeInput === 'string') {
      fee = parseFloat(feeInput);
    }

    if (isNaN(fee)) fee = 0;

    const vatRate = 0.16; // 16% VAT
    const vatAmount = fee * vatRate;
    const totalAmount = fee + vatAmount;

    // Header with Branding
    if (tenant.logoUrl) {
      try {
        // logo is usually a URL, jsPDF needs base64 or image element
        // For now we'll just put the school name if logo isn't easily embeddable server-side without a fetch lib
        // But we can try to add the text branding at least
      } catch (e) {
        console.error('Failed to add logo to PDF', e);
      }
    }

    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80); // Dark Blue
    doc.text(tenant.name.toUpperCase(), 105, 20, { align: 'center' });
    
    if (tenant.motto) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(tenant.motto, 105, 28, { align: 'center' });
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    const contactInfo = [
      tenant.address,
      tenant.phoneNumber ? `T: ${tenant.phoneNumber}` : null,
      tenant.contactEmail ? `E: ${tenant.contactEmail}` : null,
      tenant.website ? `W: ${tenant.website}` : null,
    ].filter(Boolean).join(' | ');
    
    doc.text(contactInfo, 105, 35, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 40, 190, 40);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 105, 55, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
    doc.text(`Invoice #: INV-${tenant.id.slice(0, 8).toUpperCase()}`, 20, 78);

    // Bill To
    doc.setFontSize(11);
    doc.text('BILL TO:', 20, 95);
    doc.setFontSize(10);
    doc.text('Subscription Billing Dept.', 20, 102);
    doc.text(tenant.name, 20, 108);
    doc.text(tenant.contactEmail || '', 20, 114);

    // Table
    try {
      (doc as any).autoTable({
        startY: 125,
        head: [['Description', 'Amount (KES)']],
        body: [
          [`Subscription Package: ${tenant.plan}`, fee.toFixed(2)],
          ['VAT (16%)', vatAmount.toFixed(2)],
          ['Total Paid', totalAmount.toFixed(2)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100] },
      });
    } catch (e) {
      console.error('autoTable failed, falling back to manual text', e);
      doc.text(`Subscription Package: ${tenant.plan} - ${fee.toFixed(2)}`, 20, 130);
      doc.text(`VAT (16%) - ${vatAmount.toFixed(2)}`, 20, 138);
      doc.text(`Total Paid - ${totalAmount.toFixed(2)}`, 20, 146);
      (doc as any).lastAutoTable = { finalY: 150 };
    }

    // Bank Details
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text('Payment Details:', 20, finalY);
    doc.setFontSize(10);
    doc.text('Beneficiary: SAASLINK TECHNOLOGIES LTD', 20, finalY + 10);
    doc.text('Bank: I&M Bank Ltd.', 20, finalY + 18);
    doc.text('Account: 05206707336350', 20, finalY + 26);
    doc.text('Branch: 177 Koinange', 20, finalY + 34);
    doc.text(`Reference: ${tenant.name.slice(0, 15)}`, 20, finalY + 42);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const output = doc.output('datauristring') as string;
    return output.split(',')[1];
  }

  private async sendOnboardingEmail(
    to: string,
    schoolName: string,
    username: string,
    pass: string,
    invoiceBase64: string,
  ) {
    const subject = `Welcome to Saaslink EMIS - ${schoolName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2c3e50;">Welcome to Saaslink Technologies</h2>
        <p>Hello,</p>
        <p>Your school infrastructure, <strong>${schoolName}</strong>, has been successfully provisioned on the Saaslink EMIS platform.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60; margin: 20px 0;">
          <h3 style="margin-top: 0;">Login Credentials</h3>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Password:</strong> ${pass}</p>
          <p style="font-size: 12px; color: #666;">Please change your password upon your first login.</p>
        </div>

        <h3>Financial Record</h3>
        <p>We have attached the automated invoice for your records. Please find the payment details below for your subscription:</p>
        
        <div style="background: #fdf2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #c0392b;">Payment Instructions</h3>
          <p><strong>Beneficiary:</strong> SAASLINK TECHNOLOGIES LTD</p>
          <p><strong>Bank:</strong> I&M Bank Ltd.</p>
          <p><strong>Account:</strong> 05206707336350</p>
          <p><strong>Branch:</strong> 177 Koinange</p>
          <p><strong>Reference:</strong> ${schoolName}</p>
        </div>

        <p>Best regards,<br>The Saaslink Team</p>
      </div>
    `;

    // Access the private queue through emailService or modify emailService
    // Since EmailService doesn't have a "sendWithAttachments" yet, I should add it.
    // I'll assume I update EmailService next.
    // For now, I'll use a direct call if I were to modify it.
    await this.emailService.sendEmailWithAttachments(to, subject, html, [
      {
        filename: `Invoice_${schoolName.replace(/\s/g, '_')}.pdf`,
        content: invoiceBase64,
        encoding: 'base64',
      },
    ]);
  }

  async findOne(id: string): Promise<Tenant> {
    const cachedTenant = await this.cacheManager.get<Tenant>(`tenant_${id}`);
    if (cachedTenant) {
      return cachedTenant;
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id },
    } as any);
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }

    await this.cacheManager.set(`tenant_${id}`, tenant);
    return tenant;
  }

  async update(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findOne(id);
    
    // Explicitly merge only allowed fields to prevent privilege escalation
    // (though in a real app we'd use a DTO)
    const allowedFields: (keyof Tenant)[] = [
      'name', 'logoUrl', 'website', 'phoneNumber', 
      'address', 'motto', 'contactEmail', 'mpesaPaybill'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        (tenant as any)[field] = updateData[field];
      }
    });

    const savedTenant = await this.tenantRepository.save(tenant);
    // Update cache
    await this.cacheManager.set(`tenant_${id}`, savedTenant);
    return savedTenant;
  }

  async updateGradingMode(id: string, gradingMode: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    if (!['TRADITIONAL', 'CBE', 'HYBRID'].includes(gradingMode)) {
      throw new BadRequestException('Invalid grading mode');
    }
    tenant.gradingMode = gradingMode;
    const savedTenant = await this.tenantRepository.save(tenant);
    // Update cache
    await this.cacheManager.set(`tenant_${id}`, savedTenant);
    return savedTenant;
  }
}
