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
import { SystemConfigService } from '../config/system-config.service';
import { FeesService } from '../fees/fees.service';

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
    private readonly systemConfigService: SystemConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(PendingPayment)
    private readonly pendingPaymentRepository: Repository<PendingPayment>,
    private readonly tenancyService: TenancyService,
    private readonly feesService: FeesService,
  ) {}

  private async getAccessToken(): Promise<string> {
    const consumerKey = await this.systemConfigService.get('MPESA_CONSUMER_KEY');
    const consumerSecret = await this.systemConfigService.get('MPESA_CONSUMER_SECRET');

    if (!consumerKey || !consumerSecret) {
      throw new Error(
        'M-Pesa Consumer Key or Secret is missing in system configurations or environment variables.',
      );
    }

    const auth = Buffer.from(
      `${consumerKey.trim()}:${consumerSecret.trim()}`,
    ).toString('base64');

    try {
      // Use axios directly to avoid any potential HttpService issues
      const response = await axios.get<MpesaOAuthResponse>(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: 'application/json',
          },
        },
      );

      return response.data.access_token;
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      let statusCode = 500;

      if (axios.isAxiosError(error)) {
        statusCode = error.response?.status || 500;
        const errorData = error.response?.data as
          | { errorMessage?: string; message?: string; errorCode?: string }
          | undefined;

        errorMessage =
          errorData?.errorMessage ||
          errorData?.message ||
          errorData?.errorCode ||
          error.message;

        console.error('M-Pesa OAuth Error Details:', {
          status: statusCode,
          data: error.response?.data as unknown,
        });

        if (statusCode === 400) {
          errorMessage = `Bad Request: Check if your Consumer Key/Secret are valid for the sandbox environment. (${errorMessage})`;
        } else if (statusCode === 401) {
          errorMessage = `Unauthorized: Invalid Consumer Key or Secret. (${errorMessage})`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error('M-Pesa OAuth Error:', errorMessage);
      throw new Error(
        `M-Pesa Authentication Failed (Status ${statusCode}): ${errorMessage}`,
      );
    }
  }

  async stkPush(
    phone: string,
    amount: number,
    plan: SubscriptionPlan,
    billingCycle: 'monthly' | 'annual',
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
    const shortCode = (await this.systemConfigService.get('MPESA_SHORTCODE'))?.trim();
    const passkey = (await this.systemConfigService.get('MPESA_PASSKEY'))?.trim();
    const callbackUrl = (await this.systemConfigService.get('MPESA_CALLBACK_URL'))?.trim();

    if (!shortCode || !passkey || !callbackUrl) {
      throw new Error(
        'M-Pesa configuration (Shortcode, Passkey, or Callback URL) is missing.',
      );
    }

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
        const pendingPayment = this.pendingPaymentRepository.create({
          tenant,
          amount,
          method: PaymentMethod.MPESA,
          reference: data.CheckoutRequestID,
          plan,
          billingCycle,
        });
        await this.pendingPaymentRepository.save(pendingPayment);
      }

      return data;
    } catch (error: unknown) {
      let errorData: unknown = 'Unknown error';
      let errorMessage = 'Failed to process STK Push';
      let statusCode = 500;

      if (axios.isAxiosError(error)) {
        statusCode = error.response?.status || 500;
        errorData = error.response?.data || error.message;

        if (typeof errorData === 'object' && errorData !== null) {
          const data = errorData as { errorMessage?: string; message?: string };
          errorMessage = data.errorMessage || data.message || errorMessage;
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error(
        'Mpesa STK Push Error:',
        JSON.stringify(errorData, null, 2),
      );

      throw new Error(
        `M-Pesa STK Push Failed (Status ${statusCode}): ${errorMessage}`,
      );
    }
  }

  async handleCallback(callbackData: Record<string, any>): Promise<any> {
    // Check if it's C2B Confirmation
    if (callbackData.TransactionType && callbackData.BusinessShortCode && callbackData.BillRefNumber) {
      return this.handleC2BConfirmation(callbackData);
    }

    console.log(
      'M-Pesa Callback Received:',
      JSON.stringify(callbackData, null, 2),
    );

    const body = callbackData.Body as
      | {
          stkCallback?: {
            ResultCode: number;
            ResultDesc: string;
            CheckoutRequestID: string;
          };
        }
      | undefined;

    if (!body || !body.stkCallback) {
      console.warn('Invalid M-Pesa callback body received');
      return { ResultCode: 1, ResultDesc: 'Invalid body' };
    }

    const { ResultCode, ResultDesc, CheckoutRequestID } = body.stkCallback;

    if (ResultCode === 0) {
      console.log(
        `M-Pesa Payment Successful for CheckoutRequestID: ${CheckoutRequestID}`,
      );
      const pendingPayment = await this.pendingPaymentRepository.findOne({
        where: { reference: CheckoutRequestID },
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

        // Set expiry date based on billing cycle
        const baseDate =
          tenant.expiresAt && tenant.expiresAt > new Date()
            ? new Date(tenant.expiresAt)
            : new Date();
        if (pendingPayment.billingCycle === 'annual') {
          baseDate.setFullYear(baseDate.getFullYear() + 1);
        } else {
          baseDate.setMonth(baseDate.getMonth() + 1);
        }
        tenant.expiresAt = baseDate;

        await this.tenantRepository.save(tenant);
        console.log(
          `Tenant ${tenant.name} subscription activated/updated to ${tenant.plan}`,
        );
      } else {
        console.error(
          `Pending payment not found for CheckoutRequestID: ${CheckoutRequestID}`,
        );
      }
    } else {
      console.warn(
        `M-Pesa Payment Failed/Cancelled. ResultCode: ${ResultCode}, Description: ${ResultDesc}`,
      );
    }

    return { ResultCode: 0, ResultDesc: 'Success' };
  }

  async handleC2BConfirmation(c2bData: Record<string, any>): Promise<any> {
    console.log('M-Pesa C2B Confirmation Received:', JSON.stringify(c2bData, null, 2));

    const {
      BusinessShortCode,
      BillRefNumber,
      TransAmount,
      TransID,
    } = c2bData;

    // Find Tenant by Paybill
    const tenant = await this.tenantRepository.findOne({
      where: { mpesaPaybill: BusinessShortCode },
    });

    if (!tenant) {
      console.error(`Tenant with Paybill ${BusinessShortCode} not found.`);
      return { ResultCode: 1, ResultDesc: 'Tenant not found' };
    }

    try {
      await this.feesService.processMpesaPayment(
        BillRefNumber,
        Number(TransAmount),
        TransID,
        tenant.id,
      );
      console.log(`Payment confirmed and reconciled for student ${BillRefNumber} in tenant ${tenant.name}`);
      return { ResultCode: 0, ResultDesc: 'Success' };
    } catch (error) {
      console.error('Error processing C2B payment:', error.message);
      return { ResultCode: 1, ResultDesc: error.message };
    }
  }

  async handleC2BValidation(c2bData: Record<string, any>): Promise<any> {
    console.log('M-Pesa C2B Validation Received:', JSON.stringify(c2bData, null, 2));
    // For validation, we check if student exists
    const { BusinessShortCode, BillRefNumber } = c2bData;
    const tenant = await this.tenantRepository.findOne({ where: { mpesaPaybill: BusinessShortCode } });
    
    if (!tenant) return { ResultCode: 'C2B00012', ResultDesc: 'Rejected' };

    // Simply returning success here or checking if student exists would be better
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }
}
