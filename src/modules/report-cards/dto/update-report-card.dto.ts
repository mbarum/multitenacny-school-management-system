import { PartialType } from '@nestjs/mapped-types';
import { CreateReportCardDto } from './create-report-card.dto';

export class UpdateReportCardDto extends PartialType(CreateReportCardDto) {}
