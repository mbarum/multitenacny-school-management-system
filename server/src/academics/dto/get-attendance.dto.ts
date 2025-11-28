
import { IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';

export class GetAttendanceDto {
  @IsOptional()
  @IsString() // Changed from IsUUID to allow flexible filtering
  classId?: string;

  @IsOptional()
  @IsString() // Changed from IsUUID
  studentId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
