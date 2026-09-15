
import { IsString, IsNotEmpty, IsEmail, IsDateString, IsOptional, IsBoolean, ValidateIf } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty({ message: 'Legal Name is required' })
  name!: string;

  @IsString({ message: 'A valid Class selection is required' })
  @IsNotEmpty({ message: 'A valid Class selection is required' })
  classId!: string;

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

  @ValidateIf((o, v) => v !== null && v !== undefined && v !== '')
  @IsEmail({}, { message: 'A valid Guardian Email is required' })
  @IsOptional()
  guardianEmail?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ValidateIf((o, v) => v !== null && v !== undefined && v !== '')
  @IsDateString({}, { message: 'Date of Birth must be a valid date' })
  @IsOptional()
  dateOfBirth?: string;

  @IsBoolean()
  @IsOptional()
  notifyGuardianEmail?: boolean;
}
