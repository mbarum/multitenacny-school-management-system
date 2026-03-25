import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/core/decorators/roles.decorator';
import { UserRole } from 'src/common/user-role.enum';
import { SkipSubscriptionCheck } from '../auth/decorators/skip-subscription-check.decorator';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@SkipSubscriptionCheck()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('create-checkout-session')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  createCheckoutSession(@Body() createCheckoutSessionDto: CreateCheckoutSessionDto) {
    return this.subscriptionsService.createCheckoutSession(createCheckoutSessionDto.priceId);
  }

  @Get('billing-portal')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  createBillingPortalSession() {
    return this.subscriptionsService.createBillingPortalSession();
  }
}
