import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { ExamType } from '../../entities/exam.entity';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  date!: string;

  @IsUUID()
  classId!: string;

  @IsEnum(ExamType)
  type!: ExamType;
}

export class UpdateExamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsEnum(ExamType)
  @IsOptional()
  type?: ExamType;
}
