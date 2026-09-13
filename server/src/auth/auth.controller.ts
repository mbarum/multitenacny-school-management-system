
import { Controller, Post, Body, Get, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { Public } from './public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Explicit brute-force & credential stuffing defense (max 5 per minute)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() response: Response) {
    const { email, password } = loginDto;
    const { user, token } = await this.authService.login(email, password);

    // Set HttpOnly Cookie for AI Studio Iframe compatibility
    response.cookie('jwt', token, {
        httpOnly: true,
        secure: true, // Required for SameSite=None
        sameSite: 'none', // Required for cross-origin iframe
        maxAge: 24 * 60 * 60 * 1000 
    });

    // Send user and token data back
    return response.send({ user, token });
  }

  @Public()
  @Post('logout')
  async logout(@Res() response: Response) {
      response.clearCookie('jwt');
      return response.send({ message: 'Logged out successfully' });
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Prevent registration flooding
  @Post('register-school')
  async registerSchool(@Body() registerDto: RegisterSchoolDto, @Res() response: Response) {
     const { user, token, school } = await this.authService.registerSchool(registerDto);
     
     // Set HttpOnly Cookie for AI Studio Iframe compatibility
     response.cookie('jwt', token, {
        httpOnly: true,
        secure: true, // Required for SameSite=None
        sameSite: 'none', // Required for cross-origin iframe
        maxAge: 24 * 60 * 60 * 1000 
    });

    // Return token in body to satisfy frontend handleLogin(user, token)
    return response.send({ user, token, school });
  }

  @Public()
  @Post('create-payment-intent')
  async createPaymentIntent(@Body() body: { plan: string; billingCycle: string; email: string }) {
    return this.authService.createPaymentIntent(body.plan, body.billingCycle, body.email);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Prevent email enumeration / inbox spamming
  @Post('request-password-reset')
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
