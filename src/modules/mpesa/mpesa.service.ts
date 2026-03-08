import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Tenant } from '../tenants/entities/tenant.entity';
import {
  PendingPayment,
  PaymentMethod,
} from '../payments/entities/pending-payment.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from 'src/common/subscription.enums';

interface MpesaOAuthResponse {
  access_token: string;
}

interface MpesaStkPushResponse {
  ResponseCode: string;
  CheckoutRequestID: string;
  [key: string]: any;
}

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

    if (!consumerKey || !consumerSecret) {
      throw new Error(
        'M-Pesa Consumer Key or Secret is missing in environment variables.',
      );
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      'base64',
    );

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<MpesaOAuthResponse>(
          'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
          { headers: { Authorization: `Basic ${auth}` } },
        ),
      );

      return data.access_token;
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as
          | { errorMessage?: string; message?: string }
          | undefined;
        errorMessage =
          errorData?.errorMessage || errorData?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('M-Pesa OAuth Error:', errorMessage);
      throw new Error(
        `Failed to generate M-Pesa access token: ${errorMessage}`,
      );
    }
  }

  async stkPush(
    phone: string,
    amount: number,
    plan: SubscriptionPlan,
  ): Promise<unknown> {
    const tenantId = this.tenancyService.getTenantId();
    if (!tenantId) {
      throw new NotFoundException(
        'Tenant context missing. Please ensure you are logged in and have a valid tenant ID.',
      );
    }
    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant with ID ${tenantId} not found in database.`,
      );
    }

    // Normalize phone number: 07... -> 2547...
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '254' + normalizedPhone.substring(1);
    } else if (normalizedPhone.startsWith('7')) {
      normalizedPhone = '254' + normalizedPhone;
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

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<MpesaStkPushResponse>(
          'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
          {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: normalizedPhone,
            PartyB: shortCode,
            PhoneNumber: normalizedPhone,
            CallBackURL: callbackUrl,
            AccountReference: 'SaasLink Subscription',
            TransactionDesc: 'Payment for subscription',
          },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
      );

      if (data && data.ResponseCode === '0') {
        await this.pendingPaymentRepository.save({
          tenant,
          amount,
          method: PaymentMethod.MPESA,
          reference: data.CheckoutRequestID,
          plan,
        });
      }

      return data;
    } catch (error: unknown) {
      let errorData: any = 'Unknown error';
      if (axios.isAxiosError(error)) {
        errorData = (error.response?.data as unknown) || error.message;
      } else if (error instanceof Error) {
        errorData = error.message;
      }
      console.error(
        'Mpesa STK Push Error:',
        JSON.stringify(errorData, null, 2),
      );
      throw error;
    }
  }

  async handleCallback(callbackData: Record<string, any>): Promise<void> {
    const body = callbackData.Body as
      | { stkCallback?: { ResultCode: number; CheckoutRequestID: string } }
      | undefined;
    if (!body || !body.stkCallback) return;
    const stkCallback = body.stkCallback;

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
