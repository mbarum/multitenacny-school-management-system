import { Controller, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SchoolService } from './school.service';
import { SchoolId } from '../common/decorators/school-id.decorator';
import { Country } from '../entities/school.entity';

class UpdateCountryDto {
  country!: Country;
}

@Controller('school')
@UseGuards(JwtAuthGuard)
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Put('country')
  updateCountry(@SchoolId() schoolId: string, @Body() body: UpdateCountryDto) {
    return this.schoolService.updateCountry(schoolId, body.country);
  }
}
