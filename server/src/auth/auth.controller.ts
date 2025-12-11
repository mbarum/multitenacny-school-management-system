
import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: any) {
    const { email, password } = loginDto;
    return this.authService.login(email, password);
  }

  @Public()
  @Post('register-school')
  async registerSchool(@Body() registerDto: RegisterSchoolDto) {
    return this.authService.registerSchool(registerDto);
  }

  @Public()
  @Post('request-password-reset')
  async requestPasswordReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  // JwtAuthGuard is global, so this is protected by default
  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
