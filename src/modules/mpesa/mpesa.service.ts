import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MpesaService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
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

  async stkPush(phone: string, amount: number): Promise<unknown> {
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

    const { data } = await firstValueFrom<{ data: unknown }>(
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

    return data;
  }
}
