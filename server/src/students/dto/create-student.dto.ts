
import { IsString, IsNotEmpty, IsEmail, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  @IsNotEmpty()
  classId!: string;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @IsString()
  @IsNotEmpty()
  guardianName!: string;

  @IsString()
  @IsNotEmpty()
  guardianContact!: string;

  @IsString()
  @IsNotEmpty()
  guardianAddress!: string;

  @IsEmail()
  guardianEmail!: string;

  @IsString()
  @IsNotEmpty()
  emergencyContact!: string;

  @IsDateString()
  dateOfBirth!: string;
}
