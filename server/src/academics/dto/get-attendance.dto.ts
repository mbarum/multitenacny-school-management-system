
import { IsOptional, IsUUID, IsDateString, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAttendanceDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  pagination?: string;

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
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
