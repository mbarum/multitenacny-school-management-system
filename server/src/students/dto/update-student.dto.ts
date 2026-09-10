import { IsString, IsOptional, IsEmail, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { StudentStatus } from '../../entities/student.entity';

export class UpdateStudentDto {
  @IsUUID()
  @IsOptional() // Required for batch updates, but optional for single patch
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  classId?: string;
  
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @IsString()
  @IsOptional()
  guardianName?: string;

  @IsString()
  @IsOptional()
  guardianContact?: string;

  @IsString()
  @IsOptional()
  guardianAddress?: string;

  @IsEmail()
  @IsOptional()
  guardianEmail?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;
}
