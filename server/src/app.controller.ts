import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHealth(): { status: string } {
    return { status: 'Saaslink Backend is running!' };
  }
}
