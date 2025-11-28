
import { IsOptional, IsUUID, IsString } from 'class-validator';

export class GetGradesDto {
  @IsOptional()
  @IsString()
  examId?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString() // Changed from IsUUID to allow 'all'
  classId?: string;
}
