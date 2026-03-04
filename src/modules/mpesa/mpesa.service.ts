import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Tenant } from '../tenants/entities/tenant.entity';
import { PendingPayment, PaymentMethod } from '../payments/entities/pending-payment.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { SubscriptionPlan, SubscriptionStatus } from 'src/common/subscription.enums';

@Injectable()
export class MpesaService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(PendingPayment)
    private readonly pendingPaymentRepository: Repository<PendingPayment>,
    private readonly tenancyService: TenancyService,
  ) {}

  private async getAccessToken(): Promise<string> {
    const consumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY');
    const consumerSecret = this.configService.get<string>(
      'MPESA_CONSUMER_SECRET',
    );
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      'base64',
    );

    const { data } = await firstValueFrom<{ data: { access_token: string } }>(
      this.httpService.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        { headers: { Authorization: `Basic ${auth}` } },
      ) as any,
    );

    return data.access_token;
  }

  async stkPush(phone: string, amount: number, plan: SubscriptionPlan): Promise<unknown> {
    const tenantId = this.tenancyService.getTenantId();
    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const accessToken = await this.getAccessToken();
    const shortCode = this.configService.get<string>('MPESA_SHORTCODE');
    const passkey = this.configService.get<string>('MPESA_PASSKEY');
    const callbackUrl = this.configService.get<string>('MPESA_CALLBACK_URL');

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);

    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString(
      'base64',
    );

    const { data } = await firstValueFrom<{ data: any }>(
      this.httpService.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: phone,
          PartyB: shortCode,
          PhoneNumber: phone,
          CallBackURL: callbackUrl,
          AccountReference: 'SaasLink Subscription',
          TransactionDesc: 'Payment for subscription',
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ) as any,
    );

    if (data.ResponseCode === '0') {
      await this.pendingPaymentRepository.save({
        tenant,
        amount,
        method: PaymentMethod.MPESA,
        reference: data.CheckoutRequestID,
        plan,
      });
    }

    return data;
  }

  async handleCallback(callbackData: any): Promise<void> {
    const { Body } = callbackData;
    const { stkCallback } = Body;

    if (stkCallback.ResultCode === 0) {
      const checkoutRequestId = stkCallback.CheckoutRequestID;
      const pendingPayment = await this.pendingPaymentRepository.findOne({
        where: { reference: checkoutRequestId },
        relations: ['tenant'],
      });

      if (pendingPayment) {
        pendingPayment.isApproved = true;
        await this.pendingPaymentRepository.save(pendingPayment);

        const tenant = pendingPayment.tenant;
        tenant.subscriptionStatus = SubscriptionStatus.ACTIVE;
        if (pendingPayment.plan) {
          tenant.plan = pendingPayment.plan;
        }
        await this.tenantRepository.save(tenant);
      }
    }
  }
}
