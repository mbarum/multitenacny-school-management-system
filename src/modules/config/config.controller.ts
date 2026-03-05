import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfig() {
    return {
      stripePublishableKey: this.configService.get<string>('VITE_STRIPE_PUBLISHABLE_KEY') || this.configService.get<string>('STRIPE_PUBLISHABLE_KEY'),
    };
  }

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
