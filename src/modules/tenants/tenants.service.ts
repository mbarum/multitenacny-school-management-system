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
import { UserRole } from '../../common/user-role.enum';
// @ts-ignore
import 'jspdf-autotable';
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
    const invoiceBase64 = await this.generateInvoicePDF(
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

  private async generateInvoicePDF(
    tenant: Tenant,
    fee: number,
  ): Promise<string> {
    // @ts-ignore
    const doc = new jsPDF();
    const vatRate = 0.16; // 16% VAT
    const vatAmount = fee * vatRate;
    const totalAmount = fee + vatAmount;

    // Header
    // @ts-ignore
    doc.setFontSize(20);
    // @ts-ignore
    doc.text('INVOICE', 105, 20, { align: 'center' });

    // @ts-ignore
    doc.setFontSize(12);
    // @ts-ignore
    doc.text('Issuer: Saaslink Technologies Limited', 20, 40);
    // @ts-ignore
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    // @ts-ignore
    doc.text(`Invoice #: INV-${tenant.id.slice(0, 8).toUpperCase()}`, 20, 60);

    // Bill To
    // @ts-ignore
    doc.text('Bill To:', 20, 80);
    // @ts-ignore
    doc.text(tenant.name, 20, 90);
    // @ts-ignore
    doc.text(tenant.contactEmail || '', 20, 100);

    // Table
    // @ts-ignore
    doc.autoTable({
      startY: 110,
      head: [['Description', 'Amount (KES)']],
      body: [
        [`Subscription Package: ${tenant.plan}`, fee.toFixed(2)],
        ['VAT (16%)', vatAmount.toFixed(2)],
        ['Total Paid', totalAmount.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillStyle: [100, 100, 100] },
    });

    // Bank Details
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 20;
    // @ts-ignore
    doc.setFontSize(14);
    // @ts-ignore
    doc.text('Payment Details:', 20, finalY);
    // @ts-ignore
    doc.setFontSize(10);
    // @ts-ignore
    doc.text('Beneficiary: SAASLINK TECHNOLOGIES LTD', 20, finalY + 10);
    // @ts-ignore
    doc.text('Bank: I&M Bank Ltd.', 20, finalY + 18);
    // @ts-ignore
    doc.text('Account: 05206707336350', 20, finalY + 26);
    // @ts-ignore
    doc.text('Branch: 177 Koinange', 20, finalY + 34);
    // @ts-ignore
    doc.text(`Reference: ${tenant.name.slice(0, 15)}`, 20, finalY + 42);

    // @ts-ignore
    return doc.output('datauristring').split(',')[1];
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
    await this.emailService.sendEmailWithAttachments(
      to,
      subject,
      html,
      [
        {
          filename: `Invoice_${schoolName.replace(/\s/g, '_')}.pdf`,
          content: invoiceBase64,
          encoding: 'base64',
        },
      ],
    );
  }

  async findOne(id: string): Promise<Tenant> {
    const cachedTenant = await this.cacheManager.get<Tenant>(`tenant_${id}`);
    if (cachedTenant) {
      return cachedTenant;
    }

    const tenant = await this.tenantRepository.findOneBy({ id });
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }

    await this.cacheManager.set(`tenant_${id}`, tenant);
    return tenant;
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
