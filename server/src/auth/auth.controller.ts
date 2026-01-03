
import { Controller, Post, Body, Get, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: any, @Res() response: Response) {
    const { email, password } = loginDto;
    const { user, token } = await this.authService.login(email, password);

    // Set HttpOnly Cookie
    response.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
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
  @Post('register-school')
  async registerSchool(@Body() registerDto: RegisterSchoolDto, @Res() response: Response) {
     const { user, token, school } = await this.authService.registerSchool(registerDto);
     
     // Set HttpOnly Cookie
     response.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
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
  @Post('request-password-reset')
  async requestPasswordReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
